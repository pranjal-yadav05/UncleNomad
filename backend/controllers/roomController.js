import Room from '../models/Room.js';

// Create a new room
export const createRoom = async (req, res) => {
  try {
    // Convert number fields to numbers
    const roomData = {
      ...req.body,
      id: Number(req.body.id),
      price: Number(req.body.price),
      capacity: Number(req.body.capacity),
      totalRooms: Number(req.body.totalRooms)
    };



    const room = new Room(roomData);
    await room.save();
    res.status(201).json(room);
  } catch (error) {
    console.error('Room creation error:', error);
    res.status(400).json({ 
      message: error.message,
      validationErrors: error.errors ? Object.keys(error.errors) : null
    });
  }
};


// Get all rooms
export const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find();
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single room by ID
export const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a room
export const updateRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.json(room);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a room
export const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
