import mongoose, { Schema } from "mongoose";

const orderRent = new Schema (
  {
    initialAmount: {
      type: Number,
      required: true,
    },
    finalAmount: {
      type: Number,
      required: true,
    },
    totalItem: {
      type: Number,
      default: 1,
      required: true
    },
    transactionId: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    productId: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    addressId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["placed", "dispatched", "inTransit", "delievered", "withUser", "returnInitiated", "inspection", "paymentSelection", "paymentInitiated", "pickedUp"],
    },
    paymentType: {
      type: String,
      enum: ["prepaid", "postpaid"],
    },
    validity: {
      startDate: Date,
      endDate: Date
    }
  },
  {
    timestamps: true
  }
)

export const OrderRent = mongoose.model("OrderRent",orderRent);