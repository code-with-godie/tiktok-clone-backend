import Users from '../models/User.js';
import { StatusCodes } from 'http-status-codes';
import NotFoundError from '../../../errors/not-found.js';
import BadRequestError from '../../../errors/bad-request.js';
import UnauthenticatedError from '../../../errors/unauthenticated.js';
import { uploadFile } from '../../../middlewares/uploadToCloudinary.js';

export const getAllUsers = async (req, res, next) => {
  try {
    const {
      user: { userID },
    } = req;
    const users = await Users.find({ _id: { $ne: userID } }, { password: 0 });
    if (users.length === 0) {
      return res
        .status(StatusCodes.OK)
        .json({ success: true, message: 'you have no users yet!' });
    }
    return res
      .status(StatusCodes.OK)
      .json({ success: true, nbHits: users.length, users });
  } catch (error) {
    next(error);
  }
};
export const getUserFollowingAccount = async (req, res, next) => {
  try {
    const {
      params: { id: userID },
    } = req;
    // console.log(userID);
    const accounts = await Users.aggregate([
      {
        $match: { _id: { $ne: userID } },
      },
      {
        $sample: { size: 30 },
      },
      {
        $project: {
          name: '$name',
          username: '$username',
          profilePic: '$profilePic',
        },
      },
    ]);
    return res
      .status(StatusCodes.OK)
      .json({ success: true, nbHits: accounts.length, accounts });
  } catch (error) {
    next(error);
  }
};
export const getSingleUser = async (req, res, next) => {
  try {
    const {
      params: { id: userID },
    } = req;
    const user = await Users.findOne({ _id: { $eq: userID } }, { password: 0 });
    if (!user) {
      throw new NotFoundError('no user with the provided id');
    }
    return res.status(StatusCodes.OK).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};
export const auth = async (req, res, next) => {
  try {
    let user = await Users.findOne({ email: req.body.email }, { password: 0 });
    if (user) {
      //  console.log('founf the user');
      const token = await user.createToken();
      return res.status(StatusCodes.OK).json({ success: true, user, token });
    }

    if (req.body.profilePic) {
      req.body.profilePic = {
        photo: req.body.profilePic,
        public_id: Date.now(),
      };
    }

    user = new Users({ ...req.body });
    const hashedPassword = await user.hashPassword();
    user.password = hashedPassword;
    await user.save();
    const token = await user.createToken();
    const { password, ...newUser } = user._doc;
    return res
      .status(StatusCodes.CREATED)
      .json({ success: true, user: newUser, token });
  } catch (error) {
    next(error);
  }
};
export const login = async (req, res, next) => {
  try {
    const {
      body: { email, password },
    } = req;
    if (!email || !password) {
      throw new BadRequestError('please provide both email and password!');
    }
    const user = await Users.findOne({ email });
    if (!user) {
      throw new UnauthenticatedError('INVALID EMAIL!');
    }
    const passwordMatched = await user.checkPassword(password);
    if (!passwordMatched) {
      throw new UnauthenticatedError('INVALID PASSWORD!');
    }
    const token = await user.createToken();
    const { password: removePassword, ...newUser } = user._doc;
    return res
      .status(StatusCodes.CREATED)
      .json({ success: true, user: newUser, token });
  } catch (error) {
    next(error);
  }
};
export const updateUser = async (req, res, next) => {
  try {
    const {
      params: { id: userID },
      user: { userID: loggedInUser },
    } = req;
    if (userID !== loggedInUser) {
      throw new BadRequestError('you can only update your own account!');
    }
    if (req.body.profilePic) {
      const res = await uploadFile(req.body.profilePic, 'tiktok-clone/users');
      const { secure_url, public_id } = res;
      req.body.profilePic = { secure_url, public_id };
    }
    const user = await Users.findByIdAndUpdate(
      userID,
      { ...req.body },
      { new: true, runValidators: true }
    );
    if (!user) {
      throw new NotFoundError('no use with the provided id!');
    }
    const { password, ...newUser } = user._doc;
    return res.status(StatusCodes.OK).json({ success: true, user: newUser });
  } catch (error) {
    next(error);
  }
};
export const deleteUser = async (req, res, next) => {
  try {
    const {
      params: { id: userID },
      user: { userID: loggedInUser },
    } = req;
    if (userID !== loggedInUser) {
      throw new BadRequestError('you can only delete your own account!');
    }
    const user = await Users.findByIdAndDelete(userID);
    if (!user) {
      throw new NotFoundError('no use with the provided id!');
    }
    return res
      .status(StatusCodes.OK)
      .json({ success: true, message: 'account successfully deleted!' });
  } catch (error) {
    next(error);
  }
};
export const follow = async (req, res, next) => {
  try {
    const {
      params: { id: followID },
      user: { userID: userID },
    } = req;
    let user = await Users.findById(userID);
    let follow = await Users.findById(followID);
    if (!user || !follow) {
      throw new NotFoundError('no use with the provided id!');
    }
    if (followID === userID) {
      throw new BadRequestError(`you cannot follow  yourself`);
    }
    if (follow.blockUser.includes(userID)) {
      throw new BadRequestError(
        `you cannot @${follow.username} follow  because the user blocked you`
      );
    }
    if (!user.followings.includes(followID)) {
      user = await Users.findByIdAndUpdate(
        userID,
        { $push: { followings: followID } },
        { new: true, runValidators: true }
      );
      follow = await Users.findByIdAndUpdate(
        followID,
        { $push: { followers: userID } },
        { new: true, runValidators: true }
      );
      return res.status(StatusCodes.OK).json({
        success: true,
        message: `you started following @${follow.username}`,
        user,
      });
    }
    user = await Users.findByIdAndUpdate(
      userID,
      { $pull: { followings: followID } },
      { new: true, runValidators: true }
    );
    follow = await Users.findByIdAndUpdate(
      followID,
      { $pull: { followers: userID } },
      { new: true, runValidators: true }
    );
    return res.status(StatusCodes.OK).json({
      success: true,
      message: `you unfollowed @${follow.username}`,
      user,
    });
  } catch (error) {
    next(error);
  }
};
export const sendFriendRequest = async (req, res, next) => {
  try {
    const {
      params: { id: friendID },
      user: { userID: userID },
    } = req;
    let user = await Users.findById(userID);
    let friend = await Users.findById(friendID);
    // you cannot send a friend request to yourself, to someone who you have blocked, to some who you are already friends with and you cannot send request twice
    if (!user || !friend) {
      throw new NotFoundError('no use with the provided id!');
    }
    if (friendID === userID) {
      throw new BadRequestError('you cannot friend youself!');
    }
    if (user.blockUser.includes(friendID)) {
      throw new BadRequestError(
        `you cannot send a friend request because you blocked ${user.name} `
      );
    }
    if (user.friends.includes(friendID)) {
      throw new BadRequestError(
        `you are already friends with ${friend.name} !!!!`
      );
    }
    if (friend.friendRequest.includes(userID)) {
      throw new BadRequestError('friend request already sent!');
    }
    friend = await Users.findByIdAndUpdate(
      friendID,
      { $push: { friendRequest: userID } },
      { new: true, runValidators: true }
    );
    const { password, ...newUser } = friend._doc;
    return res.status(StatusCodes.OK).json({
      success: true,
      message: `you sent a friend request to ${friend.name}`,
    });
  } catch (error) {
    next(error);
  }
};
export const blockUser = async (req, res, next) => {
  try {
    const {
      params: { id: blockID },
      user: { userID: userID },
    } = req;
    let user = await Users.findById(userID);
    let friend = await Users.findById(blockID);
    if (!user || !friend) {
      throw new NotFoundError('no use with the provided id!');
    }
    if (blockID === userID) {
      throw new BadRequestError('you cannot block youself!');
    }
    if (user.blockUser.includes(blockID)) {
      user = await Users.findByIdAndUpdate(
        userID,
        { $pull: { blockUser: blockID } },
        { new: true, runValidators: true }
      );
      return res.status(StatusCodes.OK).json({
        success: true,
        blockedUsers: user.blockUser,
        message: `you unblocked  @ ${friend.username}`,
      });
    }
    user = await Users.findByIdAndUpdate(
      userID,
      { $push: { blockUser: blockID } },
      { new: true, runValidators: true }
    );
    return res.status(StatusCodes.OK).json({
      success: true,
      blockedUsers: user.blockUser,
      message: `you blocked  @ ${friend.username}`,
    });
  } catch (error) {
    next(error);
  }
};
