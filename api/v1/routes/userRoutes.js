import express from 'express';
import {
    auth,
    blockUser,
    deleteUser,
    follow,
    getAllUsers,
    getSingleUser,
    getUserFollowingAccount,
    login,
    sendFriendRequest,
    updateUser,
} from '../controllers/usersController.js';
import authorize from '../../../middlewares/authentication.js';

const Router = express.Router();
Router.route('/').get(authorize, getAllUsers);
Router.route('/auth/login').post(login);
Router.route('/auth').post(auth);
Router.route('/send-friend-request/:id').post(authorize, sendFriendRequest);
Router.route('/block-user/:id').patch(authorize, blockUser);
Router.route('/follow/:id').patch(authorize, follow);
Router.route('/followings/account/:id').get(getUserFollowingAccount);
Router.route('/:id')
    .patch(authorize, updateUser)
    .delete(authorize, deleteUser)
    .get(getSingleUser);
export default Router;
