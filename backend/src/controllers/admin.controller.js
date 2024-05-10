import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Admin } from "../models/admin.model.js";
import { uploadOnClodinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// METHOD TO GENERATE ACCESS AND REFRESH TOKEN
const generateAccessAndRefreshToken = async (adminId) => {
  try {
    const admin = await Admin.findById(adminId);
    const accessToken = admin.generateAccessToken();
    const refreshToken = admin.generateRefreshToken();

    admin.refreshToken = refreshToken;
    await admin.save({
      validateBeforeSave: false,
    });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating token");
  }
};

// ROUTE TO REGISTER ADMIN
const registerAdmin = asyncHandler(async (req, res) => {
  const { email, fullName, password } = req.body;

  if (fullName === "" || email === "" || password === "") {
    throw new ApiError(400, "All fields are compulsory");
  }

  const existingAdmin = await Admin.findOne({
    $or: [{ email }],
  });

  if (existingAdmin) {
    throw new ApiError(409, "Mobile number or email is already in use");
  }

  const admin = await Admin.create({
    fullName,
    email,
    password,
  });

  const createdAdmin = await Admin.findById(admin._id).select(
    "-password -refreshToken"
  );
  console.log("Created admin: ", createdAdmin);
  if (!createdAdmin) {
    throw new ApiError(500, "Something went wrong while registering admin");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdAdmin, "Admin registered successfully"));
});

// ROUTE TO LOGIN ADMIN
const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    throw new ApiError(400, "Email field is missing");
  }

  const admin = await Admin.findOne({
    $or: [{ email }],
  });

  if (!admin) {
    throw new ApiError(404, "Admin not found");
  }

  // CHECKING FOR VALID PASSWORD
  const passwordValidity = await admin.isPasswordCorrect(password);

  if (!passwordValidity) {
    throw new ApiError(401, "Invalid admin credentials");
  }

  // CREATING ACCESS AND REFRESH TOKEN
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    admin._id
  );
  const loggedInAdmin = await Admin.findById(admin._id).select(
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
          admin: loggedInAdmin,
          accessToken,
          refreshToken,
        },
        "Login successful"
      )
    );
});

// ROUTE TO LOGOUT ADMIN
const logoutAdmin = asyncHandler(async (req, res) => {
  await Admin.findByIdAndUpdate(
    req.admin._id,
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

  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorised request");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const admin = await Admin.findById(decodedToken?._id);

    if (!admin) {
      throw new ApiError(401, "Invalid admin token");
    }

    if (admin?.refreshToken != incomingRefreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshToken(admin._id);

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
    throw new ApiError(401, error?.message || "invalid admin token");
  }
});


export {
  registerAdmin,
  loginAdmin,
  logoutAdmin,
  refreshAccessToken,
};