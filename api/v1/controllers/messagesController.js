import Messages from '../models/Message.js';
import { StatusCodes } from 'http-status-codes';
import NotFoundError from '../../../errors/not-found.js';
import BadRequestError from '../../../errors/bad-request.js';

export const getRoomMessagesTest = async (req, res, next) => {
    try {
        const {
            params: { id: roomID },
        } = req;
        // const messeges = await Messages.find({ roomID });
        const messeges = await Messages.aggregate([
            { $match: { roomID } },
            { $project: { month: { $month: 'createdAt' } } },
            { $group: { _id: '$month' } },
        ]);
        return res
            .status(StatusCodes.OK)
            .json({ success: true, nbHits: messeges.length, messeges });
    } catch (error) {
        next(error);
    }
};
export const getRoomMessages = async (req, res, next) => {
    try {
        const {
            params: { id: roomID },
        } = req;
        const messeges = await Messages.find({ roomID });
        return res
            .status(StatusCodes.OK)
            .json({ success: true, nbHits: messeges.length, messeges });
    } catch (error) {
        next(error);
    }
};
export const getLastRoomMessage = async (req, res, next) => {
    try {
        const {
            params: { id: roomID },
        } = req;
        const messege = await Messages.find({ roomID })
            .sort({ createdAt: -1 })
            .limit(1);
        return res.status(StatusCodes.OK).json({ success: true, messege });
    } catch (error) {
        next(error);
    }
};
export const sendMessage = async (req, res, next) => {
    try {
        const {
            params: { id: receiver },
            user: { userID: sender },
            body: { title, roomID },
        } = req;
        const message = await Messages.create({
            title,
            sender,
            receiver,
            roomID,
        });
        return res.status(StatusCodes.OK).json({ success: true, message });
    } catch (error) {
        next(error);
    }
};
export const deleteMessage = async (req, res, next) => {
    try {
        const {
            params: { id: messageID },
            user: { senderID },
        } = req;
        let message = await Messages.findById(messageID);
        if (!message) {
            throw new NotFoundError('no message with the provided id');
        }
        if (!message.users.includes(senderID) || message.to === senderID) {
            throw new BadRequestError(
                'you can only delete your own messages!!!'
            );
        }
        await Messages.findByIdAndDelete(messageID);
        return res
            .status(StatusCodes.OK)
            .json({ success: true, message: 'message deleted successfully' });
    } catch (error) {
        next(error);
    }
};
