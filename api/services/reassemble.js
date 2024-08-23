import { generateBlobSASQueryParameters, ContainerSASPermissions, StorageSharedKeyCredential, BlobServiceClient } from '@azure/storage-blob';
import path from 'path';
import fs from 'fs-extra';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import axios from 'axios';
//Azure Storage configuration
const AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=youtubeclone;AccountKey=lRZh3a1akRy1OTo9hRLIRAx3qxO0uR+6owbQzWn8aaqhDDRJ3+AzeWdDZXu3ls0L/icrAb54GTG4+AStMa6PFA==;EndpointSuffix=core.windows.net";
const containerName = 'video-chunks';
const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(containerName);
// Define __dirname for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Ensure directories exist
const UPLOAD_DIR = path.join(__dirname, '../uploads');
const OUTPUT_DIR = path.join(__dirname, '../output');
fs.ensureDirSync(UPLOAD_DIR);
fs.ensureDirSync(OUTPUT_DIR);
// Generate SAS token for a blob
function generateSAS(blobName) {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlockBlobClient(blobName);
    const sharedKeyCredential = new StorageSharedKeyCredential("youtubeclone", "lRZh3a1akRy1OTo9hRLIRAx3qxO0uR+6owbQzWn8aaqhDDRJ3+AzeWdDZXu3ls0L/icrAb54GTG4+AStMa6PFA==");
    const permissions = new ContainerSASPermissions();
    permissions.read = true;
    const expiresOn = new Date(new Date().valueOf() + 3600 * 1000); // 1 hour expiration

    const sasQueryParams = generateBlobSASQueryParameters({
        containerName: containerName,
        blobName: blobName,
        permissions: permissions,
        expiresOn: expiresOn
    }, sharedKeyCredential);

    return sasQueryParams.toString();
}


// Handle video reassembly
export const reassembleVideo = async (uniqueId, chunkPathsStore) => {

    if (!uniqueId) {
        throw new Error('Unique ID is required');
    }

    const randomFilename = `${crypto.randomBytes(16).toString('hex')}.mp4`;
    const outputFilePath = path.join(OUTPUT_DIR, randomFilename);
    const baseUrl = `https://youtubeclone.blob.core.windows.net/video-chunks/`;

    console.log(`Starting reassembly for video with unique ID: ${uniqueId}`);

    if (chunkPathsStore.length === 0) {
        console.log('No chunks found for reassembly.');
        throw new Error('No chunks found for reassembly');
    }

    const chunks = chunkPathsStore;
    delete chunkPathsStore[uniqueId]; // Clean up the store for this video ID

    chunks.sort((a, b) => {
        const aPart = parseInt(a.match(/chunk-(\d+)\.part$/)[1], 10);
        const bPart = parseInt(b.match(/chunk-(\d+)\.part$/)[1], 10);
        return aPart - bPart;
    });

    console.log('Downloading and reassembling chunks...');
    const writeStream = fs.createWriteStream(outputFilePath);

    try {
        for (const chunkPath of chunks) {
            const sasToken = generateSAS(chunkPath);
            const chunkUrl = `${baseUrl}${chunkPath}?${sasToken}`;
            const localChunkPath = path.join(UPLOAD_DIR, path.basename(chunkPath));

            console.log(`Downloading chunk from ${chunkUrl}`);
            const response = await axios({
                url: chunkUrl,
                method: 'GET',
                responseType: 'stream',
            });

            const writeStream = fs.createWriteStream(localChunkPath);
            response.data.pipe(writeStream);

            await new Promise((resolve, reject) => {
                writeStream.on('finish', resolve);
                writeStream.on('error', reject);
            });

            console.log(`Downloaded chunk to ${localChunkPath}`);

            
            const data = fs.readFileSync(localChunkPath);
            fs.appendFileSync(outputFilePath, data);
            fs.removeSync(localChunkPath); 
        }

        console.log(`File reassembled and saved as ${randomFilename}`);
        return `File reassembled and saved as ${randomFilename}`;
    } catch (error) {
        console.error('Error reassembling video from Azure:', error);
        throw new Error('Failed to reassemble video from Azure');
    }
};