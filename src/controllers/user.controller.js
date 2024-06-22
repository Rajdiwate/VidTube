import {asyncHandler} from '../utils/asyncHandler.js'
import {apiError} from  "../utils/apiError.js"
import {User} from "../models/user.models.js"
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { apiResponse } from '../utils/apiResponse.js'

const registerUser = asyncHandler(async (req, res)=>{
    //get user details from frontend
    const{username , fullName , email , password} = req.body
    
    //Do Validations (check if feilds are empty )
    if([fullName ,email , password , username].some( (feild) => feild?.trim() === "" ) ) {
        throw new apiError(400 , "All feilds are required")
    }

    //Check if user already exits
    if(User.findOne({
            $or :[ {email} , {username} ] 
    })){
        throw new apiError(409 , "User already exists")
    }

    //check for images and avatar
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if(!avatarLocalPath){
        throw new apiError(400 , "avatar is required");
    }

    //upload files to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!avatar) throw new apiError(400 , "avatar is required")
    
    //create user in db
    const user = await User.create({username : username.toLowerCase() , fullName , email , avatar : avatar.url , password , coverImage : coverImage?.url || "" })

    //create userObject with neccessary feilds
    const createdUser = await User.findById(user._id).select("-password -refreshToken") //get user details from db and remove password and refreshToken feild

    if(!createdUser) throw new apiError(500 , "Something went wrong while registering user")

    //return response to the frontend
    const response = new apiResponse(200 , createdUser)
    return res.status(201).json(response)

    
})

export {registerUser}