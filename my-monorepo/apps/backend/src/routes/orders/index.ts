import express, { Request, Response } from "express";
import { authenticate } from "../../middleware/authMiddleware"; 
import { 
  createOrder, 
  getAllOrders, 
  getOrderById, 
  updateOrderStatus, 
  deleteOrder, 
  getAllOrdersByUserId
} from "../../services/orderService/orderService";
import { isUserInTenant } from "../../services/userTenants/userTenantsService"
import logger from "../../utils/logger";

const router = express.Router();

// Create Order (Tenant Restricted)
router.post("/", authenticate ,async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { productId, userId } = req.body;

    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    const tenantId = req.user.tenantIds[0]; // Assuming single tenant per user

    // Validate that the user can only create orders for their assigned Tenant

    const isAccessGranted = await isUserInTenant(userId, tenantId);
    
    if (!isAccessGranted) {
      return res.status(403).json({ error: "Access denied: User does not belong to this tenant Product." });
    }

    const order = await createOrder(userId, productId, tenantId);
    logger.info(`Order created: ${order.id} by User ${userId}`);

    res.status(201).json(order);
  } catch (error) {
    logger.error("Error creating order: " + error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get All Orders (Tenant Restricted)
router.get("/", authenticate, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const tenantId = req.user.tenantIds[0];

    const orders = await getAllOrders(tenantId); // Fetch only orders of the tenant
    res.status(200).json(orders);
  } catch (error) {
    logger.error("Error fetching orders: " + error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get Order by ID (Tenant Restricted)
router.get("/:id", authenticate, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantIds[0];

    const order = await getOrderById(id, tenantId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    res.status(200).json(order);
  } catch (error) {
    logger.error("Error fetching order: " + error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get Order by UserID (User Restricted)
router.get("user/:userId", authenticate, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { userId } = req.params;
    const tenantId = req.user.tenantIds[0];

    const order = await getAllOrdersByUserId(userId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    res.status(200).json(order);
  } catch (error) {
    logger.error("Error fetching order: " + error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update Order Status (Tenant Restricted)
router.put("/:id", authenticate, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const tenantId = req.user.tenantIds[0];

    if (!status) return res.status(400).json({ error: "Order status is required" });

    const updatedOrder = await updateOrderStatus(id, status, tenantId);
    if (!updatedOrder) return res.status(404).json({ error: "Order not found" });

    logger.info(`Order ${id} status updated to ${status}`);
    res.status(200).json(updatedOrder);
  } catch (error) {
    logger.error("Error updating order: " + error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete Order (Tenant Restricted)
router.delete("/:id", authenticate, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantIds[0];

    const deletedOrder = await deleteOrder(id, tenantId);
    if (!deletedOrder) return res.status(404).json({ error: "Order not found" });

    logger.info(`Order deleted: ${id}`);
    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    logger.error("Error deleting order: " + error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export interface AuthRequest extends Request {
  user?: any;
}

export default router;