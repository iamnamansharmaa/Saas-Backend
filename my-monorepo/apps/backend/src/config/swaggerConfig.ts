import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Multi-Tenant SaaS API",
      version: "1.0.0",
      description: "API documentation for Multi-Tenant SaaS platform",
    },
    servers: [{ url: "http://localhost:4005/api" }],
  },
  apis: ["./src/routes/**/*.ts"], // Scans all route files for Swagger annotations
};

const swaggerSpec = swaggerJsDoc(options);

export const setupSwagger = (app: Express) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log("Swagger Docs available at http://localhost:4005/api-docs");
};