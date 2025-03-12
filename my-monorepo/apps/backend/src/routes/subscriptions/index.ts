import express, { Request, Response } from "express";
import { 
  createSubscription, 
  getAllSubscriptions, 
  getSubscriptionById, 
  cancelSubscription, 
  getAllSubscriptionByUserId
} from "../../services/subscriptionService/subscriptionService";
import logger from "../../utils/logger";
import { authenticate } from "../../middleware/authMiddleware"; 
import { AuthRequest } from "../orders/index";
import { isUserInTenant } from "../../services/userTenants/userTenantsService";

const router = express.Router();

// Create Subscription (Tenant Restricted)
router.post("/", authenticate, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { plan, userId } = req.body;
    const tenantId = req.user.tenantIds[0];  // Extract tenantId from JWT

    if (!plan) {
      return res.status(400).json({ error: "Plan is required" });
    }

    const isAccessGranted = await isUserInTenant(userId, tenantId);
        
    if (!isAccessGranted) {
      return res.status(403).json({ error: "Access denied: User does not belong to this tenant Subscription." });
    }

    const subscription = await createSubscription(userId, plan, tenantId);
    logger.info(`Subscription created: ${subscription.id} for Tenant: ${tenantId}`);
    
    res.status(201).json(subscription);
  } catch (error) {
    logger.error("Error creating subscription: " + error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get All Subscriptions (Tenant Restricted)
router.get("/", authenticate, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const tenantId = req.user.tenantIds[0];

    const subscriptions = await getAllSubscriptions(tenantId);
    res.status(200).json(subscriptions);
  } catch (error) {
    logger.error("Error fetching subscriptions: " + error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get Subscription by ID (Tenant Restricted)
router.get("/:id", authenticate, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantIds[0];

    const subscription = await getSubscriptionById(id, tenantId);
    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found or unauthorized" });
    }

    res.status(200).json(subscription);
  } catch (error) {
    logger.error("Error fetching subscription: " + error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get Subscription by UserID (User Restricted)
router.get("user/:userId", authenticate, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { userId } = req.params;

    const subscription = await getAllSubscriptionByUserId(userId);
    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found or unauthorized" });
    }

    res.status(200).json(subscription);
  } catch (error) {
    logger.error("Error fetching subscription: " + error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Cancel Subscription (Tenant Restricted)
router.delete("/:id", authenticate, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantIds[0];

    const canceledSubscription = await cancelSubscription(id, tenantId);
    if (!canceledSubscription) {
      return res.status(404).json({ error: "Subscription not found or unauthorized" });
    }

    logger.info(`Subscription canceled: ${id} for Tenant: ${tenantId}`);
    res.status(200).json({ message: "Subscription canceled successfully" });
  } catch (error) {
    logger.error("Error canceling subscription: " + error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;