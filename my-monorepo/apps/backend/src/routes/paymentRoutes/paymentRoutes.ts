import express, { Request, Response } from "express";
import { createRazorpayOrder } from "../../services/paymentService/paymentService";
import logger from "../../utils/logger";
import { authenticate } from "../../middleware/authMiddleware";

const router = express.Router();

// Initiate Payment (Stripe & Razorpay)
router.post("/create-payment", authenticate, async (req: Request, res: Response): Promise<any> => {
  try {
    const { amount, currency, provider } = req.body;
    
    if (!amount || !currency || !provider) {
      return res.status(400).json({ error: "Amount, currency, and provider are required" });
    }

    let paymentResponse;

    if (provider === "razorpay") {
      paymentResponse = await createRazorpayOrder(amount, currency);
    } else {
      return res.status(400).json({ error: "Invalid payment provider" });
    }

    logger.info(`Payment initiated: ${JSON.stringify(paymentResponse)}`);
    res.json(paymentResponse);
  } catch (error) {
    logger.error("Error initiating payment: " + error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;