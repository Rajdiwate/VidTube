import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export const uploadOnCloudinary = async (localPath) => {
    try {
        if(!localPath) return null
        const response = await cloudinary.uploader.upload(localPath , {resource_type : 'auto'})
        // console.log("File uploaded on cloudinary !" , response.url)
        fs.unlinkSync(localPath)
        return response
    } catch (error) {
        fs.unlinkSync(localPath) //remove the locally saved temporary file
        return null
    }
}