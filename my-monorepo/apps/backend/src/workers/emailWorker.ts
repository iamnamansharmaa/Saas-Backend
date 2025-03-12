import { Worker } from "bullmq";
import { redisConnection } from "../config/redis";
import { sendEmail } from "../utils/emailService";

const emailWorker = new Worker(
  "emailQueue",
  async (job) => {
    console.log(`Sending email to: ${job.data.to}`);
    await sendEmail(job.data.txo, job.data.subject, job.data.body);
  },
  { connection: redisConnection }
);

console.log("Email Worker Started!");
