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
       fileId: uploaded.fileId,
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
export const deleteMedia = catchAsync(async (req, res) => {
  const mediaId = req.params.id;

  const media = await Media.findOne({ _id: mediaId, user: req.user._id });
  if (!media) throw new AppError('Media not found or unauthorized', 404);

  // Extract ImageKit fileId from the URL or store it separately
  const fileId = media.url.split('/').pop().split('.')[0]; // crude fallback, you should store fileId at upload

  // Try deleting from ImageKit
  try {
    await imagekit.deleteFile(fileId);
  } catch (err) {
    console.error('ImageKit delete error:', err?.message || err);
    // Not throwing, allow DB delete even if cloud deletion fails
  }

  await media.deleteOne();

  res.status(200).json({
    message: 'Media deleted successfully',
  });
});

export const bulkDeleteMedia = catchAsync(async (req, res) => {
  const { ids } = req.body;
  console.log(`body ${req.body}`)
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new AppError('Please provide an array of media IDs to delete', 400);
  }

  const mediaDocs = await Media.find({
    _id: { $in: ids },
    user: req.user._id,
  });

  if (mediaDocs.length === 0) {
    throw new AppError('No media found or unauthorized', 404);
  }

  await Promise.all(
    mediaDocs.map(async (media) => {
      try {
        // Better to store and use ImageKit fileId in DB, but this works:
        const fileName = decodeURIComponent(media.url.split('/').pop());
        const fileId = fileName.split('.')[0];

        await imagekit.deleteFile(fileId);
      } catch (err) {
        console.warn('Failed to delete from ImageKit:', err.message);
      }
      await media.deleteOne();
    })
  );

  res.json({ message: `${mediaDocs.length} media items deleted successfully.` });
});