import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url'; 
//import userRouter from './routes/user.route.js';
//import authRouter from './routes/auth.route.js';
//import uploadRouter from './routes/upload.route.js';
import userRoutes from "./routes/user.js";
import videoRoutes from "./routes/video.js";
import commentRoutes from "./routes/comment.js";
import authRoutes from "./routes/auth.js";
import cors from 'cors';
dotenv.config();

// Define __dirname for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();



// Middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser());

// Ensure directories exist
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const OUTPUT_DIR = path.join(__dirname, 'output');
fs.ensureDirSync(UPLOAD_DIR);
fs.ensureDirSync(OUTPUT_DIR);

// Pass necessary variables to routes
app.use((req, res, next) => {
  req.UPLOAD_DIR = UPLOAD_DIR;
  req.OUTPUT_DIR = OUTPUT_DIR;
  next();
});

app.use((req, res, next) => {
  req.setTimeout(0); // No timeout
  res.setTimeout(0); // No timeout
  next();
});

// Initialize routes


app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/comments", commentRoutes);

// Serve static files
app.use(express.static(path.join(__dirname, '/client/dist')));

// Catch-all to serve the client application
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});

// Start the server
app.listen(4000, () => {
  
  console.log('Server is running on port 4000!');
});
