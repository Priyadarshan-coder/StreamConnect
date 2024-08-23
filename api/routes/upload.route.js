// routes/uploadRoutes.js
import express from 'express';
import multer from 'multer';
import {uploadChunks} from '../controllers/upload.controller.js';

const router = express.Router();

// Configure multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, req.UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname);
    }
});
const upload = multer({ storage: storage });

// Route to handle chunk uploads
router.post('/upload', upload.array('chunks'), uploadChunks);


export default router;
