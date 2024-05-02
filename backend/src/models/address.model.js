import mongoose, { Schema } from "mongoose";

const addressSchema = new Schema(
  {
    recipientName: {
      type: String,
      required: true,
    },
    recipientMobileNumber: {
      type: Number,
      required: true,
    },
    houseNumber: {
      type: String,
    },
    street: {
      type: String,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      default: "India", // Default
    },
    landmark: {
      type: String,
    },
    pinCode: {
      type: Number,
      required: true,
    },
    // userId: {
    //   type: Schema.Types.ObjectId,
    //   ref: "user",
    // }
  },
  {
    timestamps: true,
  }
);

export const Address = mongoose.model("Address", addressSchema);
