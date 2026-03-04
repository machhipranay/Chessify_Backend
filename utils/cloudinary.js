import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

const uploadOnCloudinary = async (filePath, publicId) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto",
      public_id: publicId,  
    });
    console.log("Upload successful:", result);
    return result;
  } catch (error) {
    fs.unlinkSync(filePath);
    return { message: "Failed to upload to Cloudinary"};
  }
};

export { uploadOnCloudinary };