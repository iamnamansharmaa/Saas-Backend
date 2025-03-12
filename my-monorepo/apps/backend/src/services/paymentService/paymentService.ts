import Stripe from "stripe";
import Razorpay from "razorpay";
import dotenv from "dotenv";

dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Create a Razorpay Order
export const createRazorpayOrder = async (amount: number, currency: string) => {
  return await razorpay.orders.create({
    amount: amount * 100, // Convert to paise
    currency
  });
};