import mongoose, { Schema } from "mongoose";

const orderBuy = new Schema(
  {
    amount: {
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
      enum: ["placed", "dispatched", "inTransit", "delievered"],
    },
    paymentType: {
      type: String,
      enum: ["prepaid", "postpaid"],
    },
  },
  {
    timestamps: true,
  }
);

export const OrderBuy = mongoose.model("OrderBuy", orderBuy);
