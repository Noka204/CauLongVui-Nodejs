let io;

/**
 * In-memory Map to track held slots per socket
 * Key: socket.id → Value: Array<{ courtId, slotId, bookingDate }>
 * @type {Map<string, Array<{ courtId: string, slotId: string, bookingDate: string }>>}
 */
const heldSlots = new Map();

/**
 * Initialize Socket.io with event handlers
 * @param {Object} socketIoInstance
 */
const init = (socketIoInstance) => {
  io = socketIoInstance;

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Client joins a court room to receive realtime events for that court
    socket.on('join_court', (courtId) => {
      if (!courtId) return;
      socket.join(courtId);
      console.log(`User ${socket.id} joined court room: ${courtId}`);
    });

    // Client leaves a court room
    socket.on('leave_court', (courtId) => {
      if (!courtId) return;
      socket.leave(courtId);
      console.log(`User ${socket.id} left court room: ${courtId}`);
    });

    // Client holds a slot (selecting before confirming booking)
    socket.on('slot:hold', (data) => {
      if (!data || !data.courtId || !data.slotId || !data.bookingDate) return;

      // Track this hold for cleanup on disconnect
      if (!heldSlots.has(socket.id)) {
        heldSlots.set(socket.id, []);
      }
      heldSlots.get(socket.id).push({
        courtId: data.courtId,
        slotId: data.slotId,
        bookingDate: data.bookingDate,
      });

      // Broadcast to others in the same court room
      socket.to(data.courtId).emit('slot:holding', {
        slotId: data.slotId,
        bookingDate: data.bookingDate,
        userId: socket.id,
      });
    });

    // Client releases a held slot (cancelled selection)
    socket.on('slot:unhold', (data) => {
      if (!data || !data.courtId || !data.slotId) return;

      // Remove from tracked holds
      removeHeldSlot(socket.id, data.slotId, data.bookingDate);

      socket.to(data.courtId).emit('slot:released', {
        slotId: data.slotId,
        bookingDate: data.bookingDate,
        userId: socket.id,
        reason: 'user_unhold',
      });
    });

    // Cleanup on disconnect: release all held slots
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      releaseAllHeldSlots(socket);
    });
  });
};

/**
 * Release all held slots for a disconnected socket
 * @param {Object} socket - Socket.io socket instance
 * @private
 */
const releaseAllHeldSlots = (socket) => {
  const holds = heldSlots.get(socket.id);
  if (!holds || holds.length === 0) {
    heldSlots.delete(socket.id);
    return;
  }

  for (const hold of holds) {
    io.to(hold.courtId).emit('slot:released', {
      slotId: hold.slotId,
      bookingDate: hold.bookingDate,
      userId: socket.id,
      reason: 'disconnect',
    });
  }

  heldSlots.delete(socket.id);
};

/**
 * Remove a specific held slot from tracking
 * @param {string} socketId
 * @param {string} slotId
 * @param {string} bookingDate
 * @private
 */
const removeHeldSlot = (socketId, slotId, bookingDate) => {
  const holds = heldSlots.get(socketId);
  if (!holds) return;

  const idx = holds.findIndex(
    (h) => h.slotId === slotId && h.bookingDate === bookingDate
  );
  if (idx !== -1) {
    holds.splice(idx, 1);
  }
  if (holds.length === 0) {
    heldSlots.delete(socketId);
  }
};

/**
 * Get Socket.io instance
 * @returns {Object}
 */
const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

/**
 * Emit event to a specific court room
 * @param {string} courtId
 * @param {string} event
 * @param {Object} data
 */
const emitToCourt = (courtId, event, data) => {
  if (io) {
    io.to(courtId).emit(event, data);
  }
};

module.exports = {
  init,
  getIO,
  emitToCourt,
};
