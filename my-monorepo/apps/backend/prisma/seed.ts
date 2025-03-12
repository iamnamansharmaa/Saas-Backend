import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import logger from "../src/utils/logger";

const prisma = new PrismaClient();

async function main() {
  try {
    logger.info("🌱 Seeding database started...");

    // Hash admin password
    const adminPassword = await bcrypt.hash("password", 10);
    logger.info("Hashed admin password");

    // Create Tenants with predefined IDs
    const amazonTenant = await prisma.tenant.create({ 
      data: { id: "AMAZON-1", name: "Amazon" } 
    });
    logger.info(`Created Tenant: ${amazonTenant.name}`);

    const flipkartTenant = await prisma.tenant.create({ 
      data: { id: "FLIPKART-2", name: "Flipkart" } 
    });
    logger.info(`Created Tenant: ${flipkartTenant.name}`);

    const myntraTenant = await prisma.tenant.create({ 
      data: { id: "MYNTRA-3", name: "Myntra" } 
    });
    logger.info(`Created Tenant: ${myntraTenant.name}`);

    // Create Roles
    const adminRole = await prisma.role.create({ data: { name: "Admin" } });
    logger.info(`Created Role: ${adminRole.name}`);

    const vendorRole = await prisma.role.create({ data: { name: "Vendor" } });
    logger.info(`Created Role: ${vendorRole.name}`);

    const customerRole = await prisma.role.create({ data: { name: "Customer" } });
    logger.info(`Created Role: ${customerRole.name}`);

    // Create an Admin User for Amazon
    const adminUser = await prisma.user.create({
      data: {
        email: "admin@amazon.com",
        password: adminPassword,
        tenants: {
          create: [
            {
              tenant: { connect: { id: amazonTenant.id } },
              role: { connect: { id: adminRole.id } },
            },
          ],
        },
      },
    });
    logger.info(`Created Admin User: ${adminUser.email} in Tenant: ${amazonTenant.name}`);

    logger.info("Database seeding completed successfully!");
  } catch (error) {
    logger.error(`Database seeding failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();