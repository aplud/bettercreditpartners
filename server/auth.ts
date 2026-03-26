import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import rateLimit from "express-rate-limit";
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";
import { pool as _pool } from "./db";
const pool = _pool ?? undefined; // connect-pg-simple accepts Pool | undefined, not null

declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
      password: string;
      role: string;
    }
  }
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function comparePasswords(supplied: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const suppliedHash = scryptSync(supplied, salt, 64).toString("hex");
  return timingSafeEqual(Buffer.from(hash), Buffer.from(suppliedHash));
}

export function setupAuth(app: Express) {
  const isProduction = process.env.NODE_ENV === "production";
  const sessionSecret = process.env.SESSION_SECRET;

  if (!sessionSecret && isProduction) {
    throw new Error("FATAL: SESSION_SECRET environment variable is required in production");
  }

  const sessionConfig: session.SessionOptions = {
    secret: sessionSecret || "bcp-dev-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
    },
  };

  if (pool) {
    const PgStore = connectPgSimple(session);
    sessionConfig.store = new PgStore({ pool, createTableIfMissing: true });
  }
  // When pool is null (no DATABASE_URL), uses default MemoryStore — fine for dev preview

  const sessionMiddleware = session(sessionConfig);

  app.use(sessionMiddleware);
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Invalid username or password" });
        }
        if (!comparePasswords(password, user.password)) {
          return done(null, false, { message: "Invalid username or password" });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user || undefined);
    } catch (err) {
      done(err);
    }
  });

  // ── Rate Limiting ──────────────────────────────────────────────────────────

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per window
    message: { message: "Too many attempts, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 registrations per hour per IP
    message: { message: "Too many registration attempts, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // ── Auth Routes ─────────────────────────────────────────────────────────────

  app.post("/api/auth/register", registerLimiter, async (req, res, next) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(409).json({ message: "Username already exists" });
      }

      const hashedPassword = hashPassword(password);
      const user = await storage.createUser({ username, password: hashedPassword });

      req.login(user, (err) => {
        if (err) return next(err);
        const { password: _, ...userWithoutPassword } = user;
        return res.status(201).json(userWithoutPassword);
      });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/auth/login", authLimiter, (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: Express.User | false, info: { message: string } | undefined) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      req.login(user, (err) => {
        if (err) return next(err);
        const { password: _, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy((err) => {
        if (err) return next(err);
        res.clearCookie("connect.sid");
        return res.json({ message: "Logged out" });
      });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const { password: _, ...userWithoutPassword } = req.user;
    return res.json(userWithoutPassword);
  });
}

// ── Middleware ───────────────────────────────────────────────────────────────

export const requireAuth: RequestHandler = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
};

export function requireRole(...roles: string[]): RequestHandler {
  return (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
}

export { hashPassword, comparePasswords };
