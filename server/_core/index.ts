/**
 * Server Entry Point - ZERO MANUS DEPENDENCIES
 * 
 * Uses simple JWT authentication instead of Manus OAuth.
 * Fully portable and self-hostable.
 */

import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import cookieParser from "cookie-parser";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import oauthRoutes from "../routes/oauth";
import { startScheduler } from "../automation/scheduler";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Cookie parser for JWT auth
  app.use(cookieParser());
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // OAuth callback routes (must be before tRPC)
  app.use("/api/oauth", oauthRoutes);
  
  // tRPC API (includes auth routes)
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.info(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.info(`Server running on http://localhost:${port}/`);
    console.info(`\n=== ZERO MANUS DEPENDENCIES ===`);
    console.info(`This server is fully portable and self-hostable.`);
    console.info(`================================\n`);
    
    // Start the background scheduler for 24/7 marketing
    console.info(`\n=== STARTING 24/7 SCHEDULER ===`);
    startScheduler();
    console.info(`Scheduler will process posts every 5 minutes`);
    console.info(`================================\n`);
  });
}

startServer().catch(console.error);
