import express from 'express';
import multer from 'multer';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import { uploadMedia, getMediaByFolder, deleteMedia, bulkDeleteMedia, getStorageUsage } from '../controllers/media.controller.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.use(isAuthenticated);


router.post('/upload', upload.array('files'), uploadMedia);
router.delete('/bulk-delete',bulkDeleteMedia)
router.get('/folder/:folderId', getMediaByFolder);


router.get('/storage/usage', getStorageUsage);
router.delete('/:id', deleteMedia);
export default router;
