import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createSubscription = async (userId: string, plan: string, tenantId: string) => {
  return await prisma.subscription.create({ 
    data: { userId, plan, tenantId, status: "active" }
  });
};

export const getAllSubscriptions = async (tenantId: string) => {
  return await prisma.subscription.findMany({ 
    where: { user: { tenants: { some: { tenantId } } } }
  });
};

export const getSubscriptionById = async (id: string, tenantId: string) => {
  return await prisma.subscription.findFirst({ 
    where: { id, user: { tenants: { some: { tenantId } } } }
  });
};

export const getAllSubscriptionByUserId = async (userId: string) => {
  return await prisma.subscription.findMany({ 
    where: { userId },
    include: { tenant: true, user: true }
  });
};

export const cancelSubscription = async (id: string, tenantId: string) => {
  return await prisma.subscription.updateMany({ 
    where: { id, user: { tenants: { some: { tenantId } } } },
    data: { status: "canceled" }
  });
};