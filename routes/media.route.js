import express from 'express';
import multer from 'multer';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import { uploadMedia, getMediaByFolder } from '../controllers/media.controller.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.use(isAuthenticated);


router.post('/upload', isAuthenticated, upload.array('files'), uploadMedia);
router.get('/folder/:folderId', getMediaByFolder);

export default router;
