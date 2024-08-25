import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs-extra';
import { BlobServiceClient } from '@azure/storage-blob';

// Azure Blob Storage Configuration
const AZURE_STORAGE_CONTAINER_NAME = 'transcoded-videos';

const blobServiceClient = BlobServiceClient.fromConnectionString(
  `${process.env.AZURE_STORAGE_CONNECTION_STRING};`
);
const containerClient = blobServiceClient.getContainerClient(AZURE_STORAGE_CONTAINER_NAME);

// Helper function to upload file to Azure Blob Storage
async function uploadFileToAzure(filePath, blobName) {
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.uploadFile(filePath);
}

// Transcode video using HLS method and upload to Azure Blob Storage
/*export default async function transcodeVideo(inputFilePath, outputDir) {
  return new Promise((resolve, reject) => {
    const resolutions = [240, 480, 720];
    const baseFileName = path.basename(inputFilePath, path.extname(inputFilePath));
    const blobDirectory = `${baseFileName}`; // Use the original file name for the directory

    const tasks = resolutions.map((resolution) => {
      return new Promise((res, rej) => {
        const outputFilePath = path.join(outputDir, `output_${resolution}p.m3u8`);
        const segmentFilePath = path.join(outputDir, `output_${resolution}p_%03d.ts`);
        
        console.log(`Transcoding to ${resolution}p...`);
        
        ffmpeg(inputFilePath)
          .output(outputFilePath)
          .videoCodec('libx264')
          .size(`?x${resolution}`)  // Ensure height is divisible by 2
          .outputOptions([
            '-hls_time 10',
            '-hls_list_size 0',
            '-hls_segment_filename', segmentFilePath,
          ])
          .on('end', async () => {
            console.log(`Transcoding to ${resolution}p completed.`);
            try {
              // Upload the transcoded files to Azure Blob Storage
              const files = fs.readdirSync(outputDir);
              for (const file of files) {
                const filePath = path.join(outputDir, file);
                if (file.endsWith('.m3u8') || file.endsWith('.ts')) {
                  const blobName = path.join(blobDirectory, file);
                  await uploadFileToAzure(filePath, blobName);
                }
              }
              res();
            } catch (uploadError) {
              rej(uploadError);
            }
          })
          .on('error', (err) => {
            console.error(`Error during ${resolution}p transcoding:`, err);
            rej(err);
          })
          .run();
      });
    });

    Promise.all(tasks)
      .then(() => {
        resolve('Transcoding and upload completed for all resolutions.');
      })
      .catch(reject);
  });
}
*/
export default async function transcodeVideo(inputFilePath, outputDir) {
  return new Promise((resolve, reject) => {
    const resolutions = [240, 480, 720];
    const baseFileName = path.basename(inputFilePath, path.extname(inputFilePath));
    const blobDirectory = `${baseFileName}`; // Use the original file name for the directory

    const tasks = resolutions.map((resolution) => {
      return new Promise((res, rej) => {
        const outputFilePath = path.join(outputDir, `${baseFileName}_output_${resolution}p.m3u8`);
        const segmentFilePath = path.join(outputDir, `${baseFileName}_output_${resolution}p_%03d.ts`);

        console.log(`Transcoding to ${resolution}p...`);

        ffmpeg(inputFilePath)
          .output(outputFilePath)
          .videoCodec('libx264')
          .size(`?x${resolution}`)  // Ensure height is divisible by 2
          .outputOptions([
            '-hls_time 10',
            '-hls_list_size 0',
            '-hls_segment_filename', segmentFilePath,
          ])
          .on('end', async () => {
            console.log(`Transcoding to ${resolution}p completed.`);
            try {
              // Upload the transcoded files to Azure Blob Storage
              const files = fs.readdirSync(outputDir);
              for (const file of files) {
                const filePath = path.join(outputDir, file);
                if (file.endsWith('.m3u8') || file.endsWith('.ts')) {
                  const blobName = path.join(blobDirectory, file);
                  await uploadFileToAzure(filePath, blobName);
                }
              }
              res();
            } catch (uploadError) {
              rej(uploadError);
            }
          })
          .on('error', (err) => {
            console.error(`Error during ${resolution}p transcoding:`, err);
            rej(err);
          })
          .run();
      });
    });

    Promise.all(tasks)
      .then(() => {
        resolve('Transcoding and upload completed for all resolutions.');
      })
      .catch(reject);
  });
}