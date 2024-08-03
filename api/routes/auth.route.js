import express from 'express';
import { google, signOut } from '../controllers/auth.controller.js';

const routes = express.Router();

routes.post('/google', google);
routes.get('/signout', signOut)

export default routes;