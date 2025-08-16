import Folder from '../models/folder.model.js';
import { AppError } from '../middleware/error.middleware.js';
import { catchAsync } from '../middleware/error.middleware.js';

// Create Folder
export const createFolder = catchAsync(async (req, res) => {
  const { name } = req.body;
  if (!name) throw new AppError('Folder name is required', 400);
console.log({ name,
    user: req.user._id,})
  const folder = await Folder.create({
    name,
    user: req.user._id,
  });

  res.status(201).json({ folder });
});

// Get all folders of user
export const getFolders = catchAsync(async (req, res) => {
  const folders = await Folder.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ folders });
});

// Update folder name
export const updateFolder = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name) throw new AppError('Folder name is required', 400);

  const folder = await Folder.findOneAndUpdate(
    { _id: id, user: req.user._id },
    { name },
    { new: true }
  );

  if (!folder) throw new AppError('Folder not found or unauthorized', 404);

  res.json({ folder });
});

// Delete folder
export const deleteFolder = catchAsync(async (req, res) => {
  const { id } = req.params;

  const folder = await Folder.findOneAndDelete({ _id: id, user: req.user._id });
  if (!folder) throw new AppError('Folder not found or unauthorized', 404);

  // Optionally: delete media in this folder (not covered here)

  res.status(204).end();
});
