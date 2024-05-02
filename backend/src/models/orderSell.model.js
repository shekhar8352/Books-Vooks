import mongoose, { Schema } from "mongoose";

const orderSell = new Schema (
  {
    amount: {
      type: Number,
      required: true,
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
      enum: ["initiated", "inspection", "paymentSelection", "initiated", "pickedUp"],
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "done"],
    },
    productGrade: {
      type: String,
      enum: ["A", "B", "C", "D"]
    }
  },
  {
    timestamps: true
  }
)

export const OrderSell = mongoose.model("OrderSell",orderSell)