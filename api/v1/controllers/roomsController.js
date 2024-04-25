import { StatusCodes } from 'http-status-codes';
import NotFoundError from '../../../errors/not-found.js';
import Users from '../models/User.js';
import BadRequestError from '../../../errors/bad-request.js';
import Room from '../models/Room.js';

export const getUserRooms = async (req, res, next) => {
  try {
    const {
      user: { userID },
    } = req;
    const rooms = await Room.find({ members: { $in: userID } }).sort({
      createdAt: -1,
    });
    return res.status(StatusCodes.OK).json({ success: true, rooms });
  } catch (error) {
    next(error);
  }
};
export const createRoom = async (req, res, next) => {
  try {
    const {
      user: { userID },
      body: { userID: otherUserID },
    } = req;
    const room = await Room.find({
      console.log(room)
      $and: [{ members: { $in: userID } }, { members: { $in: otherUserID } }],
    });
    if (room) {
      console.log('room found');
      return res.status(StatusCodes.OK).json({
        success: true,
        message: 'room found',
      });
    }
    await Room.create({ members: [userID, otherUserID] });
    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'room successfully created',
    });
  } catch (error) {
    next(error);
  }
};
export const deleteRoom = async (req, res, next) => {
  try {
  } catch (error) {
    next(error);
  }
};
