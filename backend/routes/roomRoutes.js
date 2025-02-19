import express from 'express';
const router = express.Router();
import {
  createRoom,
  getRooms,
  getRoomById,
  updateRoom,
  deleteRoom
} from '../controllers/roomController.js';

// Create a new room
router.post('/', createRoom);

// Get all rooms
router.get('/', getRooms);

// Get a single room by ID
router.get('/:id', getRoomById);

// Update a room
router.put('/:id', updateRoom);

// Delete a room
router.delete('/:id', deleteRoom);

export default router;
