import { errorHandler } from "../utils/error.js";

import path from 'path';
import fs from 'fs-extra';
import crypto from 'crypto';
import prisma from '../DB/db.config.js';
import { generateBlobSASQueryParameters, ContainerSASPermissions, StorageSharedKeyCredential, BlobServiceClient } from '@azure/storage-blob';
import { produceMessage } from '../services/kafka.js';

// Azure Storage configuration
const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(process.env.containerName);

// In-memory store for chunk paths
const chunkPathsStore = {};
let uploadCounter = 0;


// Handle chunk uploads
export const addVideo = async (req, res) => {
  console.log(req.body);
  
    const { title, totalChunks: chunksCount, desc, imgUrl, tags, id} = req.body;
    const tag_res = tags.split(","); 
    const uniqueId = title; // Create a unique identifier for each video
    const videoDir = `${uniqueId}`; // Directory for this video file

    const totalChunks = parseInt(chunksCount, 10);
    const uploadDir = req.UPLOAD_DIR; // Use the upload directory from the request object

    try {
        const uploadPromises = req.files.map(file => {
            const blobClient = containerClient.getBlockBlobClient(`${videoDir}/${file.originalname}`);
            return blobClient.uploadFile(path.join(uploadDir, file.filename))
                .then(() => fs.remove(path.join(uploadDir, file.filename)))
                .then(() => {
                    // Store the exact path of the uploaded chunk
                    if (!chunkPathsStore[uniqueId]) {
                        chunkPathsStore[uniqueId] = [];
                    }
                    chunkPathsStore[uniqueId].push(`${videoDir}/${file.originalname}`);
                });
        });

        await Promise.all(uploadPromises);

        if (chunkPathsStore[uniqueId].length > 0) {
            const newvideo = await prisma.video.create({
                data: {
                    userId: parseInt(id,10),
                    title: title,
                    desc: desc,
                    imgUrl: imgUrl,
                    videoUrl: './transcoded/title_output_',
                    chunkPaths: chunkPathsStore[uniqueId],
                    tags: tag_res
                },
            });
          
        }

        uploadCounter += req.files.length;

        if (uploadCounter === totalChunks) {
            uploadCounter = 0; // Reset counter for future uploads
            console.log('All chunks uploaded to Azure');
            res.status(200).send('All chunks uploaded to Azure');
            await produceMessage({uniqueId:uniqueId,chunkPaths:chunkPathsStore[uniqueId]});
            console.log("Message produced to Kafka Broker");
        } else {
            console.log('Chunks uploaded, waiting for more...');
            res.status(200).send('Chunks uploaded, waiting for more...');
        }
    } catch (error) {
        console.error('Error uploading chunks to Azure:', error);
        res.status(500).send('Failed to upload chunks to Azure');
    }
};



export const updateVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return next(createError(404, "Video not found!"));
    if (req.user.id === video.userId) {
      const updatedVideo = await Video.findByIdAndUpdate(
        req.params.id,
        {
          $set: req.body,
        },
        { new: true }
      );
      res.status(200).json(updatedVideo);
    } else {
      return next(createError(403, "You can update only your video!"));
    }
  } catch (err) {
    next(err);
  }
};

export const deleteVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return next(createError(404, "Video not found!"));
    if (req.user.id === video.userId) {
      await Video.findByIdAndDelete(req.params.id);
      res.status(200).json("The video has been deleted.");
    } else {
      return next(createError(403, "You can delete only your video!"));
    }
  } catch (err) {
    next(err);
  }
};

export const getVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);
    res.status(200).json(video);
  } catch (err) {
    next(err);
  }
};

export const addView = async (req, res, next) => {
  try {
    await Video.findByIdAndUpdate(req.params.id, {
      $inc: { views: 1 },
    });
    res.status(200).json("The view has been increased.");
  } catch (err) {
    next(err);
  }
};

export const random = async (req, res, next) => {
  try {
    const videos = await Video.aggregate([{ $sample: { size: 40 } }]);
    res.status(200).json(videos);
  } catch (err) {
    next(err);
  }
};

export const trend = async (req, res, next) => {
  try {
    const videos = await Video.find().sort({ views: -1 });
    res.status(200).json(videos);
  } catch (err) {
    next(err);
  }
};

export const sub = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const subscribedChannels = user.subscribedUsers;

    const list = await Promise.all(
      subscribedChannels.map(async (channelId) => {
        return await Video.find({ userId: channelId });
      })
    );

    res.status(200).json(list.flat().sort((a, b) => b.createdAt - a.createdAt));
  } catch (err) {
    next(err);
  }
};

export const getByTag = async (req, res, next) => {
  const tags = req.query.tags.split(",");
  try {
    const videos = await Video.find({ tags: { $in: tags } }).limit(20);
    res.status(200).json(videos);
  } catch (err) {
    next(err);
  }
};

export const search = async (req, res, next) => {
  const query = req.query.q;
  try {
    const videos = await Video.find({
      title: { $regex: query, $options: "i" },
    }).limit(40);
    res.status(200).json(videos);
  } catch (err) {
    next(err);
  }
};
