// swagger.js
const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Everforest API 文件",
      version: "1.0.0",
      description: "北14森森不息-露營活動票務系統的 API 文件",
    },
    servers: [
      {
        url: "http://localhost:3000/api/v1",
        description: "本地開發環境",
      },
    ],
    components: {
      securitySchemes: {
        JWT: {
          type: "apiKey",
          in: "cookie", // 如果你是從 cookie 傳 access_token
          name: "access_token",
          description: "JWT Token (access_token) 將從 cookie 傳入",
        },
      },
    },
  },
  apis: ["./routes/*.js"], // 會讀取標註的註解
};

const swaggerSpec = swaggerJSDoc(options);

const setupSwagger = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.warn("Swagger 文檔已掛載在 /api-docs");
};

module.exports = setupSwagger;
