import redisClient from "../../config/redis";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createProduct = async (
  name: string,
  description: string,
  price: number,
  tenantId: string
) => {
  const product = await prisma.product.create({
    data: { name, description, price, tenantId },
  });

  // Cache the created product
  const cacheKey = `product:${product.id}`;
  await redisClient.setEx(cacheKey, 3600, JSON.stringify(product));

  return product;
};

export const getAllProducts = async (tenantId: string) => {
  const cacheKey = `products:tenant:${tenantId}`;

  // Check if products exist in Redis cache
  const cachedProducts = await redisClient.get(cacheKey);
  if (cachedProducts) {
    return JSON.parse(cachedProducts);
  }

  // Fetch from database if not in cache
  const products = await prisma.product.findMany({ where: { tenantId } });

  // Store result in cache for 1 hour
  await redisClient.setEx(cacheKey, 3600, JSON.stringify(products));

  return products;
};

export const getProductById = async (id: string, tenantId: string) => {
  const cacheKey = `product:${id}`;

  // Check if product exists in Redis cache
  const cachedProduct = await redisClient.get(cacheKey);
  if (cachedProduct) {
    return JSON.parse(cachedProduct);
  }

  // Fetch from database if not in cache
  const product = await prisma.product.findFirst({ where: { id, tenantId } });
  if (!product) return null;

  // Store result in cache for 1 hour
  await redisClient.setEx(cacheKey, 3600, JSON.stringify(product));

  return product;
};

export const updateProduct = async (
  id: string,
  name: string,
  description: string,
  price: number,
  tenantId: string
) => {
  const product = await prisma.product.update({
    where: { id, tenantId },
    data: { name, description, price },
  });

  // Update cache after modification
  const cacheKey = `product:${id}`;
  await redisClient.setEx(cacheKey, 3600, JSON.stringify(product));

  return product;
};

export const deleteProduct = async (id: string, tenantId: string) => {
  const deletedProduct = await prisma.product.deleteMany({
    where: { id, tenantId },
  });

  // Remove from cache after deletion
  const cacheKey = `product:${id}`;
  await redisClient.del(cacheKey);

  return deletedProduct;
};