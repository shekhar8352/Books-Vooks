import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnClodinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// METHOD TO GENERATE ACCESS AND REFRESH TOKEN
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({
      validateBeforeSave: false,
    });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating token");
  }
};

// ROUTE TO REGISTER USER
const registerUser = asyncHandler(async (req, res) => {
  const { email, fullName, password, mobile } = req.body;

  // CHECKING VALIDATION
  if (fullName === "" || email === "" || password === "" || mobile === "") {
    throw new ApiError(400, "All fields are compulsory");
  }

  // CHECKING EXISTING USER
  const existingUser = await User.findOne({
    $or: [{ mobile }, { email }],
  });

  if (existingUser) {
    throw new ApiError(409, "Mobile number or email is already in use");
  }

  // SAVE THE NEW USER TO DATABASE
  const user = await User.create({
    fullName,
    mobile,
    email,
    password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  console.log("Created user: ", createdUser);
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering user");
  }

  // SENDING RESPONSE
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

// ROUTE TO LOGIN USER
const loginUser = asyncHandler(async (req, res) => {
  // FETCHING USER DATA FROM REQ BODY
  const { email, mobile, password } = req.body;
  if (!mobile && !email) {
    throw new ApiError(400, "Username or Email field is missing");
  }

  // CHECKING IF USER EXIST OR NOT
  const user = await User.findOne({
    $or: [{ email }, { mobile }],
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // CHECKING FOR VALID PASSWORD
  const passwordValidity = await user.isPasswordCorrect(password);

  if (!passwordValidity) {
    throw new ApiError(401, "Invalid user credentials");
  }

  // CREATING ACCESS AND REFRESH TOKEN
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // SENDING COOKIES
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "Login successful"
      )
    );
});

// ROUTE TO LOGOUT USER
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "Logged out successfully"));
});

// ROUTE TO REFRESH ACCESS TOKEN
const refreshAccessToken = asyncHandler(async (req, res) => {
  // FETCHING INCOMING REFRESH TOKEN FROM THE BODY OF THE REQUEST
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorised request");
  }
  try {
    // VERIFYING THE TOKEN
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    // FETCHING USER FROM THE ID OBTAINED AFTER VERIFIFICATION
    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid user token");
    }

    // MATCHING INCOMING AND SAVED REFRESH TOKEN
    if (user?.refreshToken != incomingRefreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    // GENERATING NEW TOKEN
    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "invalid user token");
  }
});

// ROUTE TO CHANGE USER PASSWORD
const changeCurrentPassword = asyncHandler(async (req, res) => {
  // FETCHING PASSWORDS
  const { oldPassword, newPassword } = req.body;

  // CHECKING IF OLD PASSWORD IS CORRECT OR NOT
  const userId = req.user?._id;

  console.log("userId", userId);
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Old password is incorrect");
  }

  // CHANGING PASSWORD
  user.password = newPassword;
  await user.save({
    validateBeforeSave: false,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

// ROUTE TO FETCH USER DETAILS
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"));
});

// ROUTE TO UPDATE USER DETAILS
const updateAccountDetails = asyncHandler(async (req, res) => {
  // CHECKING IF ALL THE FIELDS ARE PROVIDED ARE NOT
  const { fullName, mobile, email } = req.body;

  if (fullName === "" || mobile === "" || email === "") {
    throw new ApiError(400, "All fields are required");
  }

  // UPDATING THE USER DETAILS
  const userId = req.user?._id;
  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        fullName: fullName,
        email: email,
        mobile: mobile,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User details updated successfully"));
});

// ROUTE TO FETCH ALL USERS
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find();
  return res
    .status(200)
    .json(new ApiResponse(200, users, "User fetched successfully"));
});

// ROUTE TO FETCH USERS BY ID
const findUserById = asyncHandler(async (req, res) => {
  const userId = req.params?._id;

  if (userId === undefined) {
    throw new ApiError(400, "Invalid request");
  }

  const user = await User.findById(userId);
  if (user === null || user === undefined) {
    throw new ApiError(400, "Invalid userId");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User fetched successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  getAllUsers,
  findUserById,
};
