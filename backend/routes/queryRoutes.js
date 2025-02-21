import express from 'express';
import { submitQuery, getQueries, updateQueryStatus, sendQueryReply, deleteQuery } from '../controllers/queryController.js';

const router = express.Router();

// Public routes
router.post('/', submitQuery);

// Protected admin routes
router.get('/admin', getQueries);
router.put('/admin/:id/status',  updateQueryStatus);
router.post('/reply', sendQueryReply);
router.post('/delete',deleteQuery);

export default router;
