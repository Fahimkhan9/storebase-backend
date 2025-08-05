import express from 'express';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import {
  createFolder,
  getFolders,
  updateFolder,
  deleteFolder,
} from '../controllers/folder.controller.js';

const router = express.Router();

router.use(isAuthenticated);

router.post('/', createFolder);
router.get('/', getFolders);
router.put('/:id', updateFolder);
router.delete('/:id', deleteFolder);

export default router;
