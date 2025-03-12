import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import logger from "../utils/logger";

interface AuthRequest extends Request {
  user?: any;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    logger.warn(`Unauthorized access attempt. No token provided. IP: ${req.ip}`);
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    req.user = decoded;
    logger.info(`User authenticated: ${JSON.stringify(decoded)}`);
    next(); // Ensure next() is called without returning a response
  } catch (error) {
    logger.error(`JWT verification failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    res.status(401).json({ error: "Invalid token" });
    return;
  }
}
