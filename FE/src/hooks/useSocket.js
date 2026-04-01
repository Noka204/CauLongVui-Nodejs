import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { getApiOrigin } from '../services/api.client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || getApiOrigin();

/**
 * Custom hook to manage socket.io connection and real-time events.
 * @returns {{ joinCourt: Function, leaveCourt: Function, holdSlot: Function, unholdSlot: Function }}
 */
export const useSocket = () => {
  const socketRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket'],
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    // ─── Real-time Event Listeners ─────────────────────────────────

    // Khi người khác đang giữ chỗ (selecting)
    socket.on('slot:holding', (data) => {
      console.log('Slot holding:', data);
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    });

    // Khi slot được giải phóng (unhold, disconnect, timeout, cancel)
    socket.on('slot:released', (data) => {
      console.log('Slot released:', data);
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    });

    // Khi booking được tạo thành công
    socket.on('slot:booked', (data) => {
      console.log('Slot booked:', data);
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['courts'] });
    });

    // Khi booking được xác nhận (sau payment)
    socket.on('slot:confirmed', (data) => {
      console.log('Slot confirmed:', data);
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['courts'] });
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [queryClient]);

  /**
   * Join a court room to receive realtime events
   * @param {string} courtId
   */
  const joinCourt = useCallback((courtId) => {
    if (socketRef.current && courtId) {
      socketRef.current.emit('join_court', courtId);
    }
  }, []);

  /**
   * Leave a court room
   * @param {string} courtId
   */
  const leaveCourt = useCallback((courtId) => {
    if (socketRef.current && courtId) {
      socketRef.current.emit('leave_court', courtId);
    }
  }, []);

  /**
   * Hold a slot (user is selecting, notify others)
   * @param {Object} params
   * @param {string} params.courtId
   * @param {string} params.slotId
   * @param {string} params.bookingDate
   */
  const holdSlot = useCallback(({ courtId, slotId, bookingDate }) => {
    if (socketRef.current) {
      socketRef.current.emit('slot:hold', { courtId, slotId, bookingDate });
    }
  }, []);

  /**
   * Release a held slot (user cancelled selection)
   * @param {Object} params
   * @param {string} params.courtId
   * @param {string} params.slotId
   * @param {string} params.bookingDate
   */
  const unholdSlot = useCallback(({ courtId, slotId, bookingDate }) => {
    if (socketRef.current) {
      socketRef.current.emit('slot:unhold', { courtId, slotId, bookingDate });
    }
  }, []);

  return {
    joinCourt,
    leaveCourt,
    holdSlot,
    unholdSlot,
  };
};
