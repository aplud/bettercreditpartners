import { Router } from "express";
import { storage } from "../storage";

export const publicRouter = Router();

// Referral link handler
publicRouter.get("/ref/:code", async (req, res) => {
  try {
    const partner = await storage.getPartnerByReferralCode(req.params.code);
    if (!partner || partner.status !== "active") {
      return res.status(404).send("Invalid referral link");
    }

    // Set attribution cookie (30-day expiry)
    res.cookie("bcp_ref", req.params.code, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: false,
    });

    return res.redirect(`/enroll?ref=${req.params.code}`);
  } catch (error) {
    console.error("Error handling referral link:", error);
    return res.status(500).send("Server error");
  }
});

// Get active programs (for partner registration form)
publicRouter.get("/api/programs", async (_req, res) => {
  try {
    const programs = await storage.getPrograms();
    const activePrograms = programs.filter((p) => p.isActive);
    return res.json(activePrograms);
  } catch (error) {
    console.error("Error fetching programs:", error);
    return res.status(500).json({ message: "Failed to fetch programs" });
  }
});
