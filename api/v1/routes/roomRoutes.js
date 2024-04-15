import express from 'express';
import authorize from '../../../middlewares/authentication.js';
import { createRoom, getUserRooms } from '../controllers/roomsController.js';
const Router = express.Router();
Router.route('/').get(authorize, getUserRooms).post(authorize, createRoom);

export default Router;
