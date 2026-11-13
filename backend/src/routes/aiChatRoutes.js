import express from 'express';
import {
  getChatHistory,
  sendMessage,
  clearChatHistory,
} from '../controllers/aiChatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/history', getChatHistory);
router.post('/message', sendMessage);
router.delete('/history', clearChatHistory);

export default router;
