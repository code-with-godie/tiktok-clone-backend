import express from 'express';
import {
    createPost,
    getAllPosts,
    getFollowingsPosts,
    getUserAllPosts,
    toggleLikes,
    togglebookmarks,
} from '../controllers/postsController.js';
import authorize from '../../../middlewares/authentication.js';
import handleUpload from '../../../middlewares/uploadToCloudinary.js';

const Router = express.Router();

Router.route('/').post(authorize, createPost);
Router.route('/').get(getAllPosts);
Router.route('/like/:id').patch(authorize, toggleLikes);
Router.route('/bookmark/:id').patch(authorize, togglebookmarks);
Router.route('/single/:slug/:id').get(getUserAllPosts);
Router.route('/followings/posts').get(authorize, getFollowingsPosts);

export default Router;
