const Booking = require('../models/booking.model');
const PendingExpiry = require('../models/pending-expiry.model');
const BookingExchange = require('../models/booking-exchange.model');
const socketService = require('../services/socket.service');

/**
 * Initialize all Change Stream watchers
 * Must be called AFTER database connection is established
 */
const initWatchers = () => {
  watchBookingChanges();
  watchPendingExpiryDeletions();
  watchBookingExchangeChanges();
  console.log('✅ Change Stream watchers initialized');
};

/**
 * Watch Booking collection for status changes
 * Emits socket events when bookings are created or updated
 */
const watchBookingChanges = () => {
  const pipeline = [
    {
      $match: {
        $or: [
          { operationType: 'insert' },
          {
            operationType: 'update',
            'updateDescription.updatedFields.status': { $exists: true },
          },
        ],
      },
    },
  ];

  const changeStream = Booking.watch(pipeline, { fullDocument: 'updateLookup' });

  changeStream.on('change', (change) => {
    try {
      const doc = change.fullDocument;
      if (!doc || !doc.courtId) return;

      const courtId = doc.courtId.toString();
      const payload = {
        slotId: doc.slotId,
        bookingDate: doc.bookingDate,
      };

      if (change.operationType === 'insert') {
        socketService.emitToCourt(courtId, 'slot:booked', payload);
      } else if (change.operationType === 'update') {
        const newStatus = change.updateDescription.updatedFields.status;
        if (newStatus === 'Confirmed') {
          socketService.emitToCourt(courtId, 'slot:confirmed', payload);
        } else if (newStatus === 'Cancelled' || newStatus === 'Expired') {
          socketService.emitToCourt(courtId, 'slot:released', {
            ...payload,
            reason: 'status_change',
          });
        }
      }
    } catch (error) {
      console.error('Booking Change Stream error:', error.message);
    }
  });

  changeStream.on('error', (error) => {
    console.error('Booking Change Stream fatal error:', error.message);
  });
};

/**
 * Watch PendingExpiry collection for TTL deletions
 * When MongoDB TTL deletes a PendingExpiry → expire the related booking
 */
const watchPendingExpiryDeletions = () => {
  const pipeline = [
    { $match: { operationType: 'delete' } },
  ];

  // Pre-image không available cho TTL deletes, ta cần lấy bookingId từ trước
  // Cách tiếp cận: Lưu mapping trong memory hoặc dùng fullDocumentBeforeChange
  // Tuy nhiên fullDocumentBeforeChange cần MongoDB 6.0+ và changeStreamPreAndPostImages enabled
  // Phương án an toàn: Dùng scheduled check kết hợp
  const changeStream = PendingExpiry.watch(pipeline);

  changeStream.on('change', async (change) => {
    try {
      // TTL delete không cung cấp fullDocument, chỉ có _id
      // Ta cần tìm booking Pending còn lại và expire chúng
      // Cách tiếp cận tối ưu: tìm tất cả booking Pending không còn PendingExpiry
      const pendingBookings = await Booking.find({ status: 'Pending' });

      for (const booking of pendingBookings) {
        const hasExpiry = await PendingExpiry.findOne({ bookingId: booking._id });
        if (!hasExpiry) {
          // PendingExpiry đã bị TTL xóa → expire booking (không phải user hủy)
          booking.status = 'Expired';
          await booking.save();
          // Socket emit sẽ được trigger bởi watchBookingChanges ở trên
        }
      }
    } catch (error) {
      console.error('PendingExpiry Change Stream error:', error.message);
    }
  });

  changeStream.on('error', (error) => {
    console.error('PendingExpiry Change Stream fatal error:', error.message);
  });
};

/**
 * Watch BookingExchange collection for new listings and completions
 */
const watchBookingExchangeChanges = () => {
  const pipeline = [
    {
      $match: {
        $or: [
          { operationType: 'insert' },
          {
            operationType: 'update',
            'updateDescription.updatedFields.status': { $exists: true },
          },
        ],
      },
    },
  ];

  const changeStream = BookingExchange.watch(pipeline, { fullDocument: 'updateLookup' });

  changeStream.on('change', (change) => {
    try {
      const doc = change.fullDocument;
      if (!doc) return;

      if (change.operationType === 'insert') {
        // Broadcast tin pass mới đến tất cả client
        const io = socketService.getIO();
        io.emit('exchange:new', {
          exchangeId: doc._id,
          bookingId: doc.bookingId,
          price: doc.price,
          originalPrice: doc.originalPrice,
        });
      } else if (change.operationType === 'update') {
        const newStatus = change.updateDescription.updatedFields.status;
        const io = socketService.getIO();

        if (newStatus === 'Completed') {
          io.emit('exchange:taken', {
            exchangeId: doc._id,
            buyerId: doc.buyerId,
          });
        } else if (newStatus === 'Cancelled') {
          io.emit('exchange:cancelled', {
            exchangeId: doc._id,
          });
        }
      }
    } catch (error) {
      console.error('BookingExchange Change Stream error:', error.message);
    }
  });

  changeStream.on('error', (error) => {
    console.error('BookingExchange Change Stream fatal error:', error.message);
  });
};

module.exports = {
  initWatchers,
};
