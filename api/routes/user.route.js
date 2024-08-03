import express from 'express';
import { deleteUser, test, updateUser,  getUserListings, getUser} from '../controllers/user.controller.js';
import { verifyToken } from '../utils/verifyUser.js';


const routes = express.Router();

routes.get('/test', test);
routes.post('/update/:id', verifyToken, updateUser)
routes.delete('/delete/:id', verifyToken, deleteUser)
routes.get('/listings/:id', verifyToken, getUserListings)
routes.get('/:id', verifyToken, getUser)
export default routes;