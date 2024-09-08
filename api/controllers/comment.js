import { errorHandler } from "../utils/error.js";
import prisma from '../DB/db.config.js';

export const addComment = async (req, res, next) => {
  try {
    const newComment = await prisma.comment.create({
      data: {
        ...req.body,
        userId: req.user.id,
      },
    });

    res.status(200).json(newComment);
  } catch (err) {
    next(err);
  }
};

export const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(res.params.id);
    const video = await Video.findById(res.params.id);
    if (req.user.id === comment.userId || req.user.id === video.userId) {
      await Comment.findByIdAndDelete(req.params.id);
      res.status(200).json("The comment has been deleted.");
    } else {
      return next(errorHandler(403, "You can delete ony your comment!"));
    }
  } catch (err) {
    next(err);
  }
};

export const getComments = async (req, res, next) => {
  try {
    const videoId = parseInt(req.params.videoId); // Ensure videoId is an integer

    // Fetch comments related to the specific video
    const comments = await prisma.comment.findMany({
      where: { videoId: videoId },
    });

    res.status(200).json(comments);
  } catch (err) {
    next(err);
  }
};
