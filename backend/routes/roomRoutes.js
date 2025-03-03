import express from 'express';
import {
  createRoom,
  updateRoom,
  deleteRoom,
  getRoomById,
  getRooms,
  removeRoomImage
} from '../controllers/roomController.js';
import multer from 'multer'; // Import multer for handling file uploads

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/', upload.array('images', 5), (req, res, next) => {
  next();
}, createRoom);

router.put('/:id', upload.array('images', 5), (req, res, next) => {
  next();
}, updateRoom);


 // Use multer middleware for image upload
router.delete('/:id', deleteRoom);
router.get('/:id', getRoomById);
router.get('/', getRooms);

router.delete('/:roomId/image/:imageIndex', removeRoomImage);
export default router;
