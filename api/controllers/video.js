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
                   // videoUrl: './transcoded/title_output_',
                   videoUrl: 'https://www.youtube.com/watch?v=Kxv6m-mQfy8',
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
    const videoId = parseInt(req.params.id);
    const userId = req.user.id;

    const video = await prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) return next(createError(404, "Video not found!"));

    if (userId === video.userId) {
      const updatedVideo = await prisma.video.update({
        where: { id: videoId },
        data: req.body,
      });
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
    const videoId = parseInt(req.params.id);
    const userId = req.user.id;

    
    const video = await prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) return next(createError(404, "Video not found!"));

    if (userId === video.userId) {
    
      await prisma.video.delete({
        where: { id: videoId },
      });
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
    const videoId = parseInt(req.params.id);

    // Fetch the video by ID
    const video = await prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) return next(createError(404, "Video not found!"));

    res.status(200).json(video);
  } catch (err) {
    next(err);
  }
};

export const addView = async (req, res, next) => {
  try {
    const videoId = parseInt(req.params.id);

    const updatedVideo = await prisma.video.update({
      where: { id: videoId },
      data: {
        views: {
          increment: 1,
        },
      },
    });

    res.status(200).json("The view has been increased.");
  } catch (err) {
    next(err);
  }
};

export const random = async (req, res, next) => {
  try {
    const videos = await prisma.$queryRaw`SELECT * FROM "Video" ORDER BY RANDOM() LIMIT 40`;

    res.status(200).json(videos);
  } catch (err) {
    next(err);
  }
};

export const trend = async (req, res, next) => {
  try {
  
    const videos = await prisma.video.findMany({
      orderBy: {
        views: 'desc',
      },
    });

    res.status(200).json(videos);
  } catch (err) {
    next(err);
  }
};

export const sub = async (req, res, next) => {
  try {
    const userId = parseInt(req.user.id,10);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscribedUsers: true },
    });

    if (!user) return next(createError(404, "User not found!"));

    const subscribedChannels = user.subscribedUsers;

    // Fetch videos from all subscribed channels
    const videos = await prisma.video.findMany({
      where: {
        userId: { in: subscribedChannels },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json(videos);
  } catch (err) {
    next(err);
  }};

export const getByTag = async (req, res, next) => {
  const tags = req.query.tags.split(",");
  try {
    const videos = await prisma.video.findMany({
      where: {
        tags: {
          hasSome: tags, 
        },
      },
      take: 20, 
    });

    res.status(200).json(videos);
  } catch (err) {
    next(err);
  }
};

export const search = async (req, res, next) => {
  const query = req.query.q ; // Ensure query is a string
try{
    // Search videos with titles containing the query string (case-insensitive)
    const videos = await prisma.video.findMany({
      where: {
        title: {
          contains: query,
          mode: 'insensitive', // Case-insensitive search
        },
      },
      take: 40, // Limit the number of results to 40
    });

    res.status(200).json(videos);
  } catch (err) {
    next(err);
  }
};
