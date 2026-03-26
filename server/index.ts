import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import { registerRoutes } from "./routes";
import { setupAuth } from "./auth";
import { serveStatic } from "./static";
import { createServer } from "http";
import { db as _db, hasDatabase } from "./db";
const db = _db!;
import { commissions } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { storage } from "./storage";
import { startSyncInterval } from "./services/google-sheets";

function validateEnvironment() {
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required in production");
    }
    if (!process.env.SESSION_SECRET) {
      throw new Error("SESSION_SECRET is required in production");
    }
  }

  if (!process.env.SIGNNOW_API_KEY) {
    console.warn("[startup] SIGNNOW_API_KEY not set — document signing will be disabled");
  }
  if (!process.env.RESEND_API_KEY) {
    console.warn("[startup] RESEND_API_KEY not set — email notifications will be disabled");
  }
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    console.warn("[startup] GOOGLE_SERVICE_ACCOUNT_JSON not set — Sheets sync will be disabled");
  }
}

validateEnvironment();

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

const isProduction = process.env.NODE_ENV === "production";
app.use(helmet({
  contentSecurityPolicy: isProduction ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      fontSrc: ["'self'", "data:"],
      frameSrc: ["'self'", "https://*.signnow.com"],
      connectSrc: ["'self'", "https://*.signnow.com"],
    },
  } : false, // Vite dev server requires eval/inline scripts
  crossOriginEmbedderPolicy: false, // Allow iframes (SignNow)
}));

app.use(
  express.json({
    limit: "10kb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: "10kb" }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      const logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      log(logLine);
    }
  });

  next();
});

(async () => {
  setupAuth(app);
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = process.env.NODE_ENV === "production"
      ? "Internal Server Error"
      : err.message || "Internal Server Error";

    console.error("Unhandled error:", err);
    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
      log(`serving on port ${port}`);

      if (hasDatabase) {
        // Google Sheets batched sync
        startSyncInterval();

        // Commission retention check - every 6 hours
        setInterval(async () => {
          try {
            const eligibleCommissions = await db
              .select()
              .from(commissions)
              .where(
                and(
                  eq(commissions.status, "pending_retention"),
                  sql`${commissions.createdAt} + (${commissions.retentionDays} || ' days')::interval <= now()`,
                ),
              );

            let transitioned = 0;
            for (const commission of eligibleCommissions) {
              await storage.transitionCommissionStatus(commission.id, "eligible");
              transitioned++;
            }

            if (transitioned > 0) {
              log(`Retention check: ${transitioned} commission(s) transitioned to eligible`, "cron");
            }
          } catch (err) {
            console.error("Retention check failed:", err);
          }
        }, 6 * 60 * 60 * 1000);
      } else {
        log("No DATABASE_URL — skipping Sheets sync and retention cron", "startup");
      }
    },
  );
})();
