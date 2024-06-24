import { asyncHandler } from '../utils/asyncHandler.js'
import { apiError } from "../utils/apiError.js"
import { User } from "../models/user.models.js"
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { apiResponse } from '../utils/apiResponse.js'
import jwt from 'jsonwebtoken'

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const AT = await user.generateAccessToken()
        const RT = await user.generateRefreshToken()
        user.refreshToken = RT
        await user.save({ validateBeforeSave: false })
        return { AT, RT }
    } catch (error) {
        throw new apiError(500, "something went wrong while generating tokens")
    }

}

const registerUser = asyncHandler(async (req, res) => {
    //get user details from frontend
    const { username, fullName, email, password } = req.body

    //Do Validations (check if feilds are empty )
    if ([fullName, email, password, username].some((feild) => feild?.trim() === "")) {
        throw new apiError(400, "All feilds are required")
    }

    //Check if user already exits
    if (await User.findOne({
        $or: [{ email }, { username }]
    })) {
        throw new apiError(409, "User already exists")
    }

    //check for images and avatar
    let avatarLocalPath = null
    let coverImageLocalPath = null
    if (req.files?.avatar) {
        avatarLocalPath = req.files.avatar[0].path
    }
    if (req.files?.coverImage) {
        coverImageLocalPath = req.files.coverImage[0].path
    }


    if (!avatarLocalPath) {
        throw new apiError(400, "avatar is required");
    }

    //upload files to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!avatar) throw new apiError(400, "avatar is required")

    //create user in db
    const user = await User.create({ username: username.toLowerCase(), fullName, email, avatar: avatar.url, password, coverImage: coverImage?.url || "" })

    //create userObject with neccessary feilds
    const createdUser = await User.findById(user._id).select("-password -refreshToken") //get user details from db and remove password and refreshToken feild

    if (!createdUser) throw new apiError(500, "Something went wrong while registering user")

    //return response to the frontend
    const response = new apiResponse(200, createdUser)
    return res.status(201).json(response)


})

const loginUser = asyncHandler(async (req, res) => {
    //req.body 
    const { email, username, password } = req.body

    //validate
    if (!(username || email)) {
        throw new apiError(400, "username or email required")
    }

    //get user from database
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    //check if user exists
    if (!user) {
        throw new apiError(400, "No user existe with provided info")
    }

    //check password
    if (await user.isPasswordCorrect(password) === false) {
        throw new apiError(400, "Invalid password")
    }

    //generate access and refresh tokens
    const { AT, RT } = await generateAccessAndRefreshToken(user._id)
    const userObj = await User.findById(user._id).select("-password -refreshToken")

    //send cookies
    //these option will make the data sent in cookies read only. Only server can modify these cookies
    const options = {
        httpOnly: true,
        secure: true
    }

    //return response
    res.status(200)
        .cookie("accessToken", AT, options)
        .cookie("refreshToken", RT, options)
        .json(new apiResponse(200, { user: AT, RT, userObj }, "Logged in"))

})

const logoutUser = asyncHandler(async (req, res) => {
    //delete cookie from database & clear cookies
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true // returns an updated value
        }

    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new apiResponse(200, {}, "user logged out"))


})


const refreshAccessToken = asyncHandler(async (req, res) => {
    const incommingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken
    if (!incommingRefreshToken) {
        throw new apiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incommingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        const userId = decodedToken._id
        const user = User.findById(userId)
        if (!user) {
            throw new apiError(400, "invalid refreshToken")
        }
    
        if(incommingRefreshToken !== user.refreshToken){
            throw new apiError(400 , "Refresh token is expired or used")
        }
    
        const {AT , RT} = await generateAccessAndRefreshToken(userId);
    
    
        const options = {
            httpOnly: true,
            secure: true
        }
        res.status(200).cookie("accessToken", AT, options).cookie("refreshToken" , RT , options).json(new apiResponse(200 , {AT,RT} , "tokens generated"))
    
    } catch (error) {
        throw error
    }
})

export { registerUser, loginUser, logoutUser, refreshAccessToken }