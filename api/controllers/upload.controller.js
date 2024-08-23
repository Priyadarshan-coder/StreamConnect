import path from 'path';
import fs from 'fs-extra';
import crypto from 'crypto';
import prisma from '../DB/db.config.js';
import { generateBlobSASQueryParameters, ContainerSASPermissions, StorageSharedKeyCredential, BlobServiceClient } from '@azure/storage-blob';
import { produceMessage } from '../services/kafka.js';
import { dotenv } from 'dotenv';

dotenv.config();
// Azure Storage configuration
const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(process.env.containerName);

// In-memory store for chunk paths
const chunkPathsStore = {};
let uploadCounter = 0;

// Generate SAS token for a blob

// Handle chunk uploads
export const uploadChunks = async (req, res) => {
    const { filename, totalChunks: chunksCount, email } = req.body;
    const uniqueId = crypto.randomBytes(8).toString('hex'); // Create a unique identifier for each video
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
                    uniqueId: uniqueId,
                    userEmail: email,
                    chunkPaths: chunkPathsStore[uniqueId],
                },
            });
           await produceMessage({uniqueId:uniqueId,chunkPaths:chunkPathsStore[uniqueId]});
           console.log("Message produced to Kafka Broker");
        }

        uploadCounter += req.files.length;

        if (uploadCounter === totalChunks) {
            uploadCounter = 0; // Reset counter for future uploads
            console.log('All chunks uploaded to Azure');
            res.status(200).send('All chunks uploaded to Azure');
        } else {
            console.log('Chunks uploaded, waiting for more...');
            res.status(200).send('Chunks uploaded, waiting for more...');
        }
    } catch (error) {
        console.error('Error uploading chunks to Azure:', error);
        res.status(500).send('Failed to upload chunks to Azure');
    }
};

