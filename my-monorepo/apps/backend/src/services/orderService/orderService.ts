import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createOrder = async (userId: string, productId: string, tenantId: string) => {
  return await prisma.order.create({ 
    data: { userId, productId, status: "pending", tenantId }
  });
};

export const getAllOrders = async (tenantId: string) => {
  return await prisma.order.findMany({ 
    where: { tenantId },
    include: { product: true, user: true }
  });
};

export const getAllOrdersByUserId = async (userId: string) => {
  return await prisma.order.findMany({ 
    where: { userId },
    include: { product: true, user: true }
  });
};

export const getOrderById = async (id: string, tenantId: string) => {
  return await prisma.order.findFirst({ 
    where: { id, tenantId },
    include: { product: true, user: true }
  });
};

export const updateOrderStatus = async (id: string, status: string, tenantId: string) => {
  return await prisma.order.updateMany({ 
    where: { id, tenantId },
    data: { status }
  });
};

export const deleteOrder = async (id: string, tenantId: string) => {
  return await prisma.order.deleteMany({ 
    where: { id, tenantId }
  });
};