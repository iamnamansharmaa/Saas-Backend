import { createClient } from "redis";
import logger from "../utils/logger";
import { RedisOptions } from "bullmq";

// Create Redis Client
const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

// Handle Connection Errors
redisClient.on("error", (err) => {
  logger.error(`Redis connection error: ${err}`);
});

// Log Successful Connection
redisClient.on("connect", () => {
  logger.info("Connected to Redis successfully!");
});

// Ensure Redis is connected before using it
(async () => {
  try {
    await redisClient.connect();
    logger.info("Redis client is ready to use!");
  } catch (error) {
    logger.error(`Redis connection failed: ${error}`);
  }
})();

// BullMQ Redis Connection Configuration
export const redisConnection: RedisOptions = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
};

// Export Redis Client for Reuse
export default redisClient;
