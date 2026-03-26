import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { insertContactMessageSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { createSigningInvite, checkDocumentStatus } from "./services/signnow";
import { requireAuth } from "./auth";
import { adminRouter } from "./routes/admin";
import { partnerRouter } from "./routes/partner";
import { publicRouter } from "./routes/public";
import { db, hasDatabase } from "./db";
import { sql } from "drizzle-orm";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Health check
  app.get("/api/health", async (_req, res) => {
    const health: Record<string, any> = {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };

    // Check database
    try {
      if (hasDatabase && db) {
        await db.execute(sql`SELECT 1`);
        health.database = "connected";
      } else {
        health.database = "memory-storage";
      }
    } catch (e) {
      health.database = "error";
      health.status = "degraded";
    }

    res.json(health);
  });

  // Mount sub-routers
  app.use("/api/admin", adminRouter);
  app.use("/api/partners", partnerRouter);
  app.use(publicRouter); // public routes (no prefix, includes /ref/:code)

  // Contact form endpoint
  app.post("/api/contact", async (req, res) => {
    try {
      const result = insertContactMessageSchema.safeParse(req.body);

      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({
          message: validationError.message
        });
      }

      const message = await storage.createContactMessage(result.data);

      return res.status(201).json({
        message: "Message received successfully",
        id: message.id
      });
    } catch (error) {
      console.error("Error creating contact message:", error);
      return res.status(500).json({
        message: "An error occurred while processing your request"
      });
    }
  });

  // SignNow: Create embedded signing invite
  app.post("/api/signnow/create-invite", requireAuth, async (req, res) => {
    try {
      const templateId = process.env.SIGNNOW_TEMPLATE_ID || "bda51151da5f43a0be50bc68a338efea38387d37";
      const result = await createSigningInvite(
        templateId,
        `CROA Disclosure - ${Date.now()}`,
      );
      return res.status(200).json(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("SignNow create-invite error:", errorMessage);
      return res.status(500).json({
        message: errorMessage.includes("SIGNNOW_API_KEY")
          ? "Signing service is not configured. Please contact support@bettercreditpartners.com."
          : "Failed to create signing session. Please try again.",
      });
    }
  });

  // SignNow: Check document signing status
  app.get("/api/signnow/status/:documentId", requireAuth, async (req, res) => {
    try {
      const completed = await checkDocumentStatus(req.params.documentId);
      return res.status(200).json({ completed });
    } catch (error) {
      console.error("SignNow status check error:", error);
      return res.status(500).json({
        message: "Failed to check signing status",
        completed: false,
      });
    }
  });

  return httpServer;
}
