import express, { Request, Response } from "express";
import { createProduct, getAllProducts, getProductById, updateProduct, deleteProduct } from "../../services/productService/productService";
import logger from "../../utils/logger";
import { authenticate } from "../../middleware/authMiddleware"; 
import { AuthRequest } from "../orders/index"

const router = express.Router();

// Create Product (Tenant Restricted)
router.post("/", authenticate, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { name, description, price } = req.body;
    const tenantId = req.user.tenantIds[0]; // Extract tenant from authenticated user

    if (!name || !description || !price) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const product = await createProduct(name, description, price, tenantId);
    logger.info(`Product created: ${product.id} by Tenant ${tenantId}`);
    
    res.status(201).json(product);
  } catch (error) {
    logger.error("Error creating product: " + error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products for a tenant
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: string
 *         required: true
 *         example: "AMAZON-1"
 *     responses:
 *       200:
 *         description: Successfully retrieved products
 *       403:
 *         description: Access denied
 */

// Get All Products (Tenant Restricted)
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user.tenantIds[0];
    const products = await getAllProducts(tenantId);

    res.json(products);
  } catch (error) {
    logger.error("Error fetching products: " + error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get Product by ID (Tenant Restricted)
router.get("/:id", authenticate, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantIds[0];

    const product = await getProductById(id, tenantId);
    if (!product) return res.status(404).json({ error: "Product not found" });

    res.json(product);
  } catch (error) {
    logger.error("Error fetching product: " + error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update Product (Tenant Restricted)
router.put("/:id", authenticate, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { name, description, price } = req.body;
    const { id } = req.params;
    const tenantId = req.user.tenantIds[0];

    const product = await updateProduct(id, name, description, price, tenantId);
    if (!product) return res.status(404).json({ error: "Product not found or unauthorized" });

    logger.info(`Product updated: ${product.id} in Tenant ${tenantId}`);
    res.json(product);
  } catch (error) {
    logger.error("Error updating product: " + error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete Product (Tenant Restricted)
router.delete("/:id", authenticate, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantIds[0];

    const deletedProduct = await deleteProduct(id, tenantId);
    if (!deletedProduct) return res.status(404).json({ error: "Product not found or unauthorized" });

    logger.info(`Product deleted: ${id} in Tenant ${tenantId}`);
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    logger.error("Error deleting product: " + error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;