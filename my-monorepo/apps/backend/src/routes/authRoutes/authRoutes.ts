import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import logger from "../../utils/logger";
import { hashPassword, comparePassword, generateToken } from "../../services/authService/authService";
import { emailQueue } from "../../queues/emailQueue";


const prisma = new PrismaClient();
const router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - tenantId
 *               - roleId
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 example: "securepassword"
 *               tenantId:
 *                 type: string
 *                 example: "AMAZON-1"
 *               roleId:
 *                 type: string
 *                 example: "Admin"
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Missing required fields
 */

// Register a New User
router.post("/register", async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password, tenantId, roleId } = req.body;

    if (!email || !password || !roleId || !tenantId) {
      logger.warn("Missing required fields in registration request");
      return res.status(400).json({ error: "Email, password, roleId, and tenantId are required" });
    }

    logger.info(`User registration attempt: ${email}`);

    // Check if the email is already registered
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: { tenants: true },
    });

    if (existingUser) {
      logger.warn(`User ${email} already exists`);
      return res.status(400).json({ error: "Email already in use" });
    }

    // Validate tenant
    const tenantExists = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenantExists) {
      logger.warn(`Invalid tenant ID: ${tenantId} for email: ${email}`);
      return res.status(400).json({ error: "Invalid tenant ID" });
    }

    // Validate role
    const roleExists = await prisma.role.findUnique({ where: { id: roleId } });
    if (!roleExists) {
      logger.warn(`Invalid role ID: ${roleId} for email: ${email}`);
      return res.status(400).json({ error: "Invalid role ID" });
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    // Associate user with Tenant and Role via UserTenant
    await prisma.userTenant.create({
      data: {
        userId: user.id,
        tenantId,
        roleId,
      },
    });

    logger.info(`User registered successfully: ${email}`);
    res.status(201).json({ message: "User registered successfully", user });

    // After successful registration
    await emailQueue.add("sendWelcomeEmail", {
      to: email,
      subject: "Welcome to Our Platform!",
      body: "Thank you for signing up!",
    });

  } catch (error) {
    logger.error(`Error in user registration for ${req.body.email}: ${error}`);
    res.status(500).json({ error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" });
  }
});

// Login User
router.post("/login", async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;
    logger.info(`User login attempt: ${email}`);

    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenants: true },
    });

    if (!user || !(await comparePassword(password, user.password))) {
      logger.warn(`Failed login attempt for ${email}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Fetch user tenant info (fetches both tenants and roles)
    const userTenants = await prisma.userTenant.findMany({
      where: { userId: user.id },
      include: { tenant: true, role: true },
    });

    const tenantIds = userTenants.map((t) => t.tenant.id);
    const roleIds = userTenants.map((r) => r.role.id);

    const token = generateToken(user.id, tenantIds, roleIds);

    logger.info(`User logged in successfully: ${email}`);
    res.json({ token });
  } catch (error) {
    logger.error(`Error in user login for ${req.body.email}: ${error}`);
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Protected Route
router.get("/protected", async (req: Request, res: Response): Promise<any> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    logger.warn("Unauthorized access attempt to /protected route");
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    logger.info(`Protected route accessed by user ID: ${(decoded as any).id}`);
    res.json({ message: "Access granted", user: decoded });
  } catch (error) {
    logger.error(`Invalid token attempt on /protected route: ${error}`);
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;