import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Validate that user belongs to this tenant
export const isUserInTenant = async (userId: string, tenantId: string) => {
  const userTenant = await prisma.userTenant.findUnique({
    where: {
      userId_tenantId: { userId, tenantId },
    },
    include: { role: true }, // Fetch role details
  });

  return userTenant && userTenant.role.name !== "Customer"; // Ensure role is not Customer
};