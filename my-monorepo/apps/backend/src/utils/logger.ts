import winston from "winston";
import "winston-mongodb";
import dotenv from "dotenv";

dotenv.config();

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({ format: winston.format.simple() }),
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.MongoDB({
      level: "info",
      db: process.env.MONGO_URI || "mongodb://localhost:27017/logs_db",
      collection: "logs",
      options: { useUnifiedTopology: true },
    }),
  ],
});

export default logger;