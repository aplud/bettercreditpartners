import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth, requireRole, hashPassword } from "../auth";
import { storage } from "../storage";
import { randomBytes } from "crypto";
import { createSigningInvite, checkDocumentStatus } from "../services/signnow";
import { markDirty } from "../services/google-sheets";
import { sendPartnerWelcome, sendNewLeadAlert } from "../services/email";

export const partnerRouter = Router();

const partnerRegisterLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { message: "Too many registration attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

function generateReferralCode(): string {
  return randomBytes(5).toString("hex").toUpperCase(); // 10-char hex
}

// ── Public: Partner Registration ────────────────────────────────────────────

partnerRouter.post("/register", partnerRegisterLimiter, async (req, res, next) => {
  try {
    const {
      username,
      password,
      companyName,
      contactName,
      email,
      phone,
      programId,
      paymentMethod,
      paymentDetails,
    } = req.body;

    // Validate required fields
    if (!username || !password || !companyName || !contactName || !email || !phone || !paymentMethod) {
      return res.status(400).json({
        message: "username, password, companyName, contactName, email, phone, and paymentMethod are required",
      });
    }

    // Auto-assign default program if not specified
    let program;
    if (programId) {
      program = await storage.getProgram(programId);
      if (!program || !program.isActive) {
        return res.status(400).json({ message: "Invalid or inactive program" });
      }
    } else {
      // Assign the first active program
      const programs = await storage.getPrograms();
      program = programs.find((p) => p.isActive);
      if (!program) {
        return res.status(500).json({ message: "No active referral program available" });
      }
    }

    // Check if username already taken
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({ message: "Username already exists" });
    }

    // Step 1: Create user with role "partner"
    const hashedPassword = hashPassword(password);
    const user = await storage.createUser({ username, password: hashedPassword });
    await storage.updateUser(user.id, { role: "partner" });
    user.role = "partner";

    // Step 2: Generate unique referral code
    let referralCode = generateReferralCode();
    let existing = await storage.getPartnerByReferralCode(referralCode);
    while (existing) {
      referralCode = generateReferralCode();
      existing = await storage.getPartnerByReferralCode(referralCode);
    }

    // Step 3: Create partner record
    const partner = await storage.createPartner({
      userId: user.id,
      programId,
      companyName,
      contactName,
      email,
      phone,
      status: "pending",
      referralCode,
      paymentMethod,
      paymentDetails: paymentDetails || null,
    });

    // Step 4: If program has a SignNow template, create signing invite
    let signingLink: string | null = null;
    if (program.signnowTemplateId) {
      try {
        const signnowResult = await createSigningInvite(
          program.signnowTemplateId,
          `Partner Agreement - ${companyName} - ${Date.now()}`,
        );
        signingLink = signnowResult.signingLink;

        // Step 5: Create partner agreement record
        await storage.createAgreement({
          partnerId: partner.id,
          programId: program.id,
          signNowDocumentId: signnowResult.documentId,
          status: "sent",
          sentAt: new Date(),
        });
      } catch (err) {
        console.error("Failed to create SignNow agreement:", err);
        // Registration still succeeds; agreement can be re-sent later
      }
    }

    markDirty("partners");

    // Fire-and-forget welcome email
    sendPartnerWelcome(contactName, email).catch(console.error);

    // Step 6: Auto-login
    req.login(user, (err) => {
      if (err) return next(err);

      // Step 7: Return partner + signing link
      const { password: _, ...userWithoutPassword } = user;
      return res.status(201).json({
        user: userWithoutPassword,
        partner,
        signingLink,
      });
    });
  } catch (error) {
    console.error("Error registering partner:", error);
    return res.status(500).json({ message: "Failed to register partner" });
  }
});

// ── Authenticated Partner Routes ────────────────────────────────────────────

// Check agreement signing status
partnerRouter.get("/agreement-status", requireAuth, requireRole("partner"), async (req, res) => {
  try {
    const partner = await storage.getPartnerByUserId(req.user!.id);
    if (!partner) {
      return res.status(404).json({ message: "Partner profile not found" });
    }

    const agreement = await storage.getAgreementByPartner(partner.id);
    if (!agreement) {
      return res.json({ status: "no_agreement", signed: false });
    }

    if (agreement.status === "signed") {
      return res.json({ status: "signed", signed: true });
    }

    // Check SignNow document status
    try {
      const isSigned = await checkDocumentStatus(agreement.signNowDocumentId);
      if (isSigned) {
        await storage.updateAgreementStatus(agreement.id, "signed", new Date());
        await storage.updatePartnerStatus(partner.id, "active");
        markDirty("partners");
        return res.json({ status: "signed", signed: true });
      }
    } catch (err) {
      console.error("Error checking SignNow status:", err);
    }

    return res.json({ status: agreement.status, signed: false });
  } catch (error) {
    console.error("Error checking agreement status:", error);
    return res.status(500).json({ message: "Failed to check agreement status" });
  }
});

// Generate a signing link for the partner's agreement
partnerRouter.post("/agreement-signing-link", requireAuth, requireRole("partner"), async (req, res) => {
  try {
    const partner = await storage.getPartnerByUserId(req.user!.id);
    if (!partner) {
      return res.status(404).json({ message: "Partner profile not found" });
    }

    const program = await storage.getProgram(partner.programId);
    if (!program?.signnowTemplateId) {
      return res.json({ signingLink: null, message: "No signing template configured for this program" });
    }

    // Check if there's an existing unsigned agreement
    let agreement = await storage.getAgreementByPartner(partner.id);
    if (agreement?.status === "signed") {
      return res.json({ signingLink: null, message: "Agreement already signed" });
    }

    // Create a new signing invite
    const signnowResult = await createSigningInvite(
      program.signnowTemplateId,
      `Partner Agreement - ${partner.companyName} - ${Date.now()}`,
    );

    if (!agreement) {
      await storage.createAgreement({
        partnerId: partner.id,
        programId: program.id,
        signNowDocumentId: signnowResult.documentId,
        status: "sent",
        sentAt: new Date(),
      });
    }

    return res.json({ signingLink: signnowResult.signingLink, documentId: signnowResult.documentId });
  } catch (error) {
    console.error("Error creating signing link:", error);
    return res.status(500).json({ message: "Failed to create signing link" });
  }
});

// Get current partner profile
partnerRouter.get("/me", requireAuth, requireRole("partner"), async (req, res) => {
  try {
    const partner = await storage.getPartnerByUserId(req.user!.id);
    if (!partner) {
      return res.status(404).json({ message: "Partner profile not found" });
    }

    const program = await storage.getProgram(partner.programId);
    return res.json({ partner, program });
  } catch (error) {
    console.error("Error fetching partner profile:", error);
    return res.status(500).json({ message: "Failed to fetch partner profile" });
  }
});

// Update partner profile
partnerRouter.patch("/me", requireAuth, requireRole("partner"), async (req, res) => {
  try {
    const partner = await storage.getPartnerByUserId(req.user!.id);
    if (!partner) {
      return res.status(404).json({ message: "Partner profile not found" });
    }

    const allowedFields = ["paymentMethod", "paymentDetails", "contactName", "email", "phone", "companyName"];
    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    const updated = await storage.updatePartner(partner.id, updates);

    markDirty("partners");
    return res.json(updated);
  } catch (error) {
    console.error("Error updating partner profile:", error);
    return res.status(500).json({ message: "Failed to update partner profile" });
  }
});

// Get partner's own commissions with program details
partnerRouter.get("/commissions", requireAuth, requireRole("partner"), async (req, res) => {
  try {
    const partner = await storage.getPartnerByUserId(req.user!.id);
    if (!partner) {
      return res.status(404).json({ message: "Partner profile not found" });
    }

    const partnerCommissions = await storage.getCommissionsByPartner(partner.id);
    const program = await storage.getProgram(partner.programId);

    // Enrich commissions with lead contact names
    const partnerLeads = await storage.getLeadsByPartner(partner.id);
    const leadMap = new Map(partnerLeads.map((l) => [l.id, l]));
    const enrichedCommissions = partnerCommissions.map((c) => {
      const lead = leadMap.get(c.leadId);
      return { ...c, leadContactName: lead?.contactName ?? "Unknown" };
    });

    return res.json({
      commissions: enrichedCommissions,
      program,
    });
  } catch (error) {
    console.error("Error fetching partner commissions:", error);
    return res.status(500).json({ message: "Failed to fetch commissions" });
  }
});

// Change own password
partnerRouter.post("/change-password", requireAuth, requireRole("partner"), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "currentPassword and newPassword are required" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters" });
    }

    const user = await storage.getUser(req.user!.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { hashPassword, comparePasswords } = await import("../auth");
    if (!comparePasswords(currentPassword, user.password)) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const hashed = hashPassword(newPassword);
    await storage.updateUser(user.id, { password: hashed });

    return res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    return res.status(500).json({ message: "Failed to change password" });
  }
});

// ── Lead Management ─────────────────────────────────────────────────────────

// Submit a lead manually
partnerRouter.post("/leads", requireAuth, requireRole("partner"), async (req, res) => {
  try {
    const partner = await storage.getPartnerByUserId(req.user!.id);
    if (!partner) {
      return res.status(404).json({ message: "Partner profile not found" });
    }

    if (partner.status !== "active") {
      return res.status(403).json({ message: "Partner account is not active" });
    }

    const { contactName, email, phone } = req.body;
    if (!contactName || !email || !phone) {
      return res.status(400).json({ message: "contactName, email, and phone are required" });
    }

    // Check for duplicate leads (within program's retention window)
    const program = await storage.getProgram(partner.programId);
    const retentionDays = program?.retentionDays || 60;
    const duplicate = await storage.checkDuplicateLead(email, retentionDays, phone);
    if (duplicate) {
      return res.status(409).json({
        message: "A lead with this email or phone was already submitted recently",
        existingLeadId: duplicate.id,
      });
    }

    const lead = await storage.createLead({
      partnerId: partner.id,
      contactName,
      email,
      phone,
      source: "form",
      status: "new",
    });

    markDirty("leads");

    // Fire-and-forget new lead alert email
    sendNewLeadAlert(process.env.ADMIN_NOTIFICATION_EMAIL || "aaron@bettercreditpartners.com", contactName, partner.companyName).catch(console.error);

    return res.status(201).json(lead);
  } catch (error) {
    console.error("Error creating lead:", error);
    return res.status(500).json({ message: "Failed to create lead" });
  }
});

// Get partner's own leads
partnerRouter.get("/leads", requireAuth, requireRole("partner"), async (req, res) => {
  try {
    const partner = await storage.getPartnerByUserId(req.user!.id);
    if (!partner) {
      return res.status(404).json({ message: "Partner profile not found" });
    }

    const leads = await storage.getLeadsByPartner(partner.id);
    return res.json(leads);
  } catch (error) {
    console.error("Error fetching leads:", error);
    return res.status(500).json({ message: "Failed to fetch leads" });
  }
});
