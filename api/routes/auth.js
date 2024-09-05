import express from "express";
import { google, signOut } from "../controllers/auth.js";

const router = express.Router();

//CREATE A USER
//router.post("/signup", signup)

//SIGN IN
//router.post("/signin", signin)

//GOOGLE AUTH
router.post("/google", google);
router.post("/signout",signOut);

export default router;