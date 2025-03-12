import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/authRoutes/authRoutes";
import productRoutes from "./routes/products/index";
import orderRoutes from "./routes/orders/index";
import subscriptionRoutes from "./routes/subscriptions/index";
import paymentRoutes from "./routes/paymentRoutes/paymentRoutes";
import { PrismaClient } from "@prisma/client";
import logger from "./utils/logger";
import { apiLimiter } from "./middleware/rateLimit";
import { setupSwagger } from "./config/swaggerConfig";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient();

app.use(express.json());
app.use(cors());
app.use(helmet());

// Setup Swagger API Docs
setupSwagger(app);

// Middleware to log all requests
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url} from ${req.ip}`);
  next();
});

// Apply rate limiting to all APIs
app.use("/api/", apiLimiter);

// Register Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/payments", paymentRoutes);

app.listen(PORT, async () => {
  try {
    await prisma.$connect();
    logger.info("Connected to database");
    console.log(`Server running on port ${PORT}`);
  } catch (error) {
    logger.error("Error connecting to database: " + error);
    process.exit(1);
  }
});