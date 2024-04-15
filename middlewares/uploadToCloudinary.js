import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const handleUpload = async (req, res, next) => {
    try {
        const {
            body: { file, folder },
        } = req;
        const response = await uploadFile(file, folder);
        const { secure_url, public_id } = response;
        req.file = { secure_url, public_id };
        next();
    } catch (error) {
        next(error);
    }
};

export const uploadFile = async (file, folder) => {
    const response = await cloudinary.uploader.upload(file, {
        resource_type: 'auto',
        folder,
    });
    return response;
};
export const updateFile = async (file, folder) => {
    // cloudinary.config({
    //     cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    //     api_key:process.env.CLOUDINARY_API_KEY,
    //     api_secret:process.env.CLOUDINARY_API_SECRET
    // })
    const response = await cloudinary.uploader.upload(file, {
        resource_type: 'auto',
        folder,
    });
    return response;
};
export const deleteFile = async public_id => {
    // cloudinary.config({
    //     cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    //     api_key:process.env.CLOUDINARY_API_KEY,
    //     api_secret:process.env.CLOUDINARY_API_SECRET
    // })
    const response = await cloudinary.uploader.destroy(public_id);
    return response;
};

export default handleUpload;
