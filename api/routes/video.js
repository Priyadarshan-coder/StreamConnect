import express from "express";
import { addVideo, addView, getByTag, getVideo, random, search, sub, trend } from "../controllers/video.js";
import { verifyToken } from "../utils/verifyUser.js";
import multer from 'multer';
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
router.post('/', upload.array('chunks'), addVideo);
//create a video
//router.post("/", verifyToken, addVideo)
router.put("/:id", verifyToken, addVideo)
router.delete("/:id", verifyToken, addVideo)
router.get("/find/:id", getVideo)
router.put("/view/:id", addView)
router.get("/trend", trend)
router.get("/random", random)
router.get("/sub",verifyToken, sub)
router.get("/tags", getByTag)
router.get("/search", search)

export default router;
