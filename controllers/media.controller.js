import imagekit from '../utils/imagekit.js'
import Media from '../models/media.model.js';
import Folder from '../models/folder.model.js';
import { AppError } from '../middleware/error.middleware.js';
import { catchAsync } from '../middleware/error.middleware.js';
import fs from 'fs/promises';

export const uploadMedia = catchAsync(async (req, res) => {
  const { folderId } = req.body;
  if (!folderId) throw new AppError('folderId is required', 400);

  // Verify folder belongs to user
  const folder = await Folder.findOne({ _id: folderId, user: req.user._id });
  if (!folder) throw new AppError('Invalid folder', 400);

  if (!req.files || req.files.length === 0) throw new AppError('No files uploaded', 400);

  const uploadedMedia = [];

  // Upload all files sequentially (can optimize with Promise.all if needed)
  for (const file of req.files) {
    const fileBuffer = await fs.readFile(file.path);
    const mimeType = file.mimetype;

    const uploaded = await imagekit.upload({
      file: fileBuffer,
      fileName: file.originalname,
      folder: folder.name,
    });

    const mediaDoc = await Media.create({
      url: uploaded.url,
      fileType: mimeType.startsWith('image') ? 'image' : 'pdf',
      folder: folder._id,
      user: req.user._id,
      originalName: file.originalname,
    });

    uploadedMedia.push(mediaDoc);

    await fs.unlink(file.path); // cleanup local file
  }

  res.status(201).json({ media: uploadedMedia });
});
export const getMediaByFolder = catchAsync(async (req, res) => {
  const { folderId } = req.params;

  // Validate folder ownership
  const folder = await Folder.findOne({ _id: folderId, user: req.user._id });
  if (!folder) throw new AppError('Folder not found or unauthorized', 404);

  const media = await Media.find({ folder: folderId, user: req.user._id }).sort({ createdAt: -1 });

  res.json({ media });
});