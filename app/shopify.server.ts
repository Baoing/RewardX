import "@shopify/shopify-app-react-router/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-react-router/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";

// 验证必需的环境变量
const requiredEnvVars = {
  SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY,
  SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET,
  SHOPIFY_APP_URL: process.env.SHOPIFY_APP_URL,
}

// 检查缺失的环境变量
const missingEnvVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key)

if (missingEnvVars.length > 0) {
  const errorMessage = `❌ 缺少必需的环境变量: ${missingEnvVars.join(", ")}\n\n` +
    `请确保在部署平台（Vercel/Render）中设置以下环境变量：\n` +
    `- SHOPIFY_API_KEY: 你的 Shopify App API Key\n` +
    `- SHOPIFY_API_SECRET: 你的 Shopify App API Secret\n` +
    `- SHOPIFY_APP_URL: 你的应用部署 URL（例如: https://your-app.vercel.app 或 https://your-app.onrender.com）\n\n` +
    `如果使用 Vercel:\n` +
    `  1. 进入项目设置 > Environment Variables\n` +
    `  2. 添加上述环境变量\n\n` +
    `如果使用 Render:\n` +
    `  1. 进入服务设置 > Environment\n` +
    `  2. 添加上述环境变量\n\n` +
    `注意: SHOPIFY_APP_URL 应该是完整的 HTTPS URL，例如: https://your-app.vercel.app`

  throw new Error(errorMessage)
}

const shopify = shopifyApp({
  apiKey: requiredEnvVars.SHOPIFY_API_KEY!,
  apiSecretKey: requiredEnvVars.SHOPIFY_API_SECRET!,
  apiVersion: ApiVersion.October25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: requiredEnvVars.SHOPIFY_APP_URL!,
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.October25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
