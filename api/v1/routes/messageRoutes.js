import express from 'express';
import {
    deleteMessage,
    getLastRoomMessage,
    getRoomMessages,
    getRoomMessagesTest,
    sendMessage,
} from '../controllers/messagesController.js';
import authorize from '../../../middlewares/authentication.js';

const Router = express.Router();

Router.route('/last-room-messege/:id').get(getLastRoomMessage);
Router.route('/test/sms').get(getRoomMessagesTest);
Router.route('/:id')
    .get(authorize, getRoomMessages)
    .post(authorize, sendMessage)
    .delete(authorize, deleteMessage);

export default Router;
