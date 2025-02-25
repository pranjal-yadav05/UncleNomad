import express from 'express';
import {
  createRoom,
  updateRoom,
  deleteRoom,
  getRoomById,
  getRooms,
} from '../controllers/roomController.js';
import multer from 'multer'; // Import multer for handling file uploads

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage }) // Set up multer for file uploads

// Room routes
router.post('/', upload.single('image'), (req, res, next) => {
  console.log('POST request received for room creation');
  console.log('File:', req.file);
  console.log('Body:', req.body);
  next();
}, createRoom);
 // Use multer middleware for image upload
 router.put('/:id', upload.single('image'), (req, res, next) => {
  console.log(`PUT request received for room ${req.params.id}`);
  console.log('File:', req.file);
  console.log('Body:', req.body);
  next();
}, updateRoom);
 // Use multer middleware for image upload
router.delete('/:id', deleteRoom);
router.get('/:id', getRoomById);
router.get('/', getRooms);

export default router;
