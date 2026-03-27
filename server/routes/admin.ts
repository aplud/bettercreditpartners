import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth, requireRole } from "../auth";
import { storage } from "../storage";
import { markDirty, fullSync, getSyncStatus } from "../services/google-sheets";
import { sendLeadConvertedNotification, sendPayoutNotification } from "../services/email";

export const adminRouter = Router();

const adminCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 admin creations per hour per IP
  message: { message: "Too many admin creation attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// All admin routes require admin role
adminRouter.use(requireAuth, requireRole("admin"));

// ── Referral Program CRUD ─────────────────────────────────────────────────────

// Create a referral program
adminRouter.post("/programs", async (req, res) => {
  try {
    const { name, commissionAmount, retentionDays, payoutSchedule, description, signnowTemplateId } = req.body;

    if (!name || commissionAmount == null || !retentionDays || !payoutSchedule) {
      return res.status(400).json({
        message: "name, commissionAmount, retentionDays, and payoutSchedule are required",
      });
    }

    const program = await storage.createProgram({
      name,
      commissionAmount,
      retentionDays,
      payoutSchedule,
      description: description || null,
      signnowTemplateId: signnowTemplateId || null,
      isActive: true,
    });

    await storage.createAuditEntry({
      userId: req.user!.id,
      action: "create_program",
      entityType: "referral_program",
      entityId: program.id,
      details: `Created program "${name}"`,
    });

    return res.status(201).json(program);
  } catch (error) {
    console.error("Error creating program:", error);
    return res.status(500).json({ message: "Failed to create program" });
  }
});

// List all programs (active and inactive)
adminRouter.get("/programs", async (_req, res) => {
  try {
    const programs = await storage.getPrograms();
    return res.json(programs);
  } catch (error) {
    console.error("Error listing programs:", error);
    return res.status(500).json({ message: "Failed to list programs" });
  }
});

// Update a program
adminRouter.patch("/programs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await storage.getProgram(id);
    if (!existing) {
      return res.status(404).json({ message: "Program not found" });
    }

    const allowedFields = ["name", "commissionAmount", "retentionDays", "payoutSchedule", "description", "signnowTemplateId"];
    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    const program = await storage.updateProgram(id, updates);

    await storage.createAuditEntry({
      userId: req.user!.id,
      action: "update_program",
      entityType: "referral_program",
      entityId: id,
      details: `Updated fields: ${Object.keys(updates).join(", ")}`,
    });

    return res.json(program);
  } catch (error) {
    console.error("Error updating program:", error);
    return res.status(500).json({ message: "Failed to update program" });
  }
});

// Deactivate a program
adminRouter.patch("/programs/:id/deactivate", async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await storage.getProgram(id);
    if (!existing) {
      return res.status(404).json({ message: "Program not found" });
    }

    const program = await storage.updateProgram(id, { isActive: false });

    await storage.createAuditEntry({
      userId: req.user!.id,
      action: "deactivate_program",
      entityType: "referral_program",
      entityId: id,
      details: `Deactivated program "${existing.name}"`,
    });

    return res.json(program);
  } catch (error) {
    console.error("Error deactivating program:", error);
    return res.status(500).json({ message: "Failed to deactivate program" });
  }
});

// ── Phase 5: Commission Automation ────────────────────────────────────────────

// Admin submit a lead on behalf of a partner
adminRouter.post("/leads", async (req, res) => {
  try {
    const { contactName, email, phone, partnerId } = req.body;
    if (!contactName || !email || !partnerId) {
      return res.status(400).json({ message: "contactName, email, and partnerId are required" });
    }
    const partner = await storage.getPartner(partnerId);
    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }
    const lead = await storage.createLead({
      contactName,
      email,
      phone: phone || "",
      partnerId,
      source: "form",
      status: "new",
    });
    await storage.addAuditLog({
      action: "create",
      entityType: "lead",
      entityId: lead.id,
      userId: (req.user as any)?.id || "admin",
      details: `Admin submitted lead: ${contactName}`,
    });
    return res.status(201).json(lead);
  } catch (error) {
    console.error("Error creating lead:", error);
    return res.status(500).json({ message: "Failed to create lead" });
  }
});

// Update lead status
adminRouter.post("/leads/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "status is required" });
    }

    const validStatuses = ["new", "contacted", "converted", "lost", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const lead = await storage.getLead(id);
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    // Validate transitions: new->contacted, contacted->converted, converted->cancelled, any->lost
    const allowedTransitions: Record<string, string[]> = {
      new: ["contacted", "lost"],
      contacted: ["converted", "lost"],
      converted: ["lost", "cancelled"],
      lost: ["lost"],
      cancelled: [],
    };

    const allowed = allowedTransitions[lead.status];
    if (!allowed || !allowed.includes(status)) {
      return res.status(400).json({
        message: `Invalid status transition: ${lead.status} -> ${status}`,
      });
    }

    const convertedAt = status === "converted" ? new Date() : undefined;
    const updated = await storage.updateLeadStatus(id, status, convertedAt);

    // When a lead is cancelled, auto-void any associated commission
    if (status === "cancelled") {
      const allCommissions = await storage.getAllCommissions();
      const leadCommissions = allCommissions.filter(
        (c: any) => c.leadId === id && (c.status === "pending_retention" || c.status === "eligible")
      );
      for (const commission of leadCommissions) {
        await storage.transitionCommissionStatus(commission.id, "voided", "Client cancelled / refunded before 91 days");
        await storage.createAuditEntry({
          userId: req.user!.id,
          action: "void_commission",
          entityType: "commission",
          entityId: commission.id,
          details: `Auto-voided: lead ${id} cancelled/refunded`,
        });
      }
      markDirty("commissions");
    }

    await storage.createAuditEntry({
      userId: req.user!.id,
      action: "update_lead_status",
      entityType: "lead",
      entityId: id,
      details: `Status changed: ${lead.status} -> ${status}`,
    });

    markDirty("leads");
    return res.json(updated);
  } catch (error) {
    console.error("Error updating lead status:", error);
    return res.status(500).json({ message: "Failed to update lead status" });
  }
});

// Convert a lead (full conversion with commission creation)
adminRouter.post("/leads/:id/convert", async (req, res) => {
  try {
    const { id } = req.params;

    const lead = await storage.getLead(id);
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    if (lead.status === "converted") {
      return res.status(400).json({ message: "Lead is already converted" });
    }

    if (lead.status === "lost") {
      return res.status(400).json({ message: "Cannot convert a lost lead" });
    }

    // Get partner and their program
    const partner = await storage.getPartner(lead.partnerId);
    if (!partner) {
      return res.status(404).json({ message: "Partner not found for this lead" });
    }

    const program = await storage.getProgram(partner.programId);
    if (!program) {
      return res.status(404).json({ message: "Program not found for this partner" });
    }

    // Update lead status to converted (also sets retentionStartDate)
    const now = new Date();
    const updated = await storage.updateLeadStatus(id, "converted", now);

    // Create commission record
    const commission = await storage.createCommission({
      partnerId: partner.id,
      leadId: id,
      programId: program.id,
      amount: program.commissionAmount,
      retentionDays: program.retentionDays,
      status: "pending_retention",
    });

    await storage.createAuditEntry({
      userId: req.user!.id,
      action: "convert_lead",
      entityType: "lead",
      entityId: id,
      details: `Lead converted. Commission ${commission.id} created for $${(program.commissionAmount / 100).toFixed(2)} with ${program.retentionDays}-day retention.`,
    });

    markDirty("leads");
    markDirty("commissions");

    // Fire-and-forget lead converted notification
    sendLeadConvertedNotification(partner.email, partner.contactName, lead.contactName).catch(console.error);

    return res.json({ lead: updated, commission });
  } catch (error) {
    console.error("Error converting lead:", error);
    return res.status(500).json({ message: "Failed to convert lead" });
  }
});

// Void a commission
adminRouter.post("/commissions/:id/void", async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: "reason is required" });
    }

    if (reason && reason.length > 500) {
      return res.status(400).json({ message: "Reason must be 500 characters or fewer" });
    }

    // Fetch the commission to check its status
    const allCommissions = await storage.getAllCommissions();
    const commission = allCommissions.find((c) => c.id === id);
    if (!commission) {
      return res.status(404).json({ message: "Commission not found" });
    }

    if (!["pending_retention", "eligible"].includes(commission.status)) {
      return res.status(400).json({
        message: `Cannot void a commission with status "${commission.status}". Only pending_retention or eligible commissions can be voided.`,
      });
    }

    const updated = await storage.transitionCommissionStatus(id, "voided", reason);

    await storage.createAuditEntry({
      userId: req.user!.id,
      action: "void_commission",
      entityType: "commission",
      entityId: id,
      details: `Commission voided. Reason: ${reason}`,
    });

    markDirty("commissions");
    return res.json(updated);
  } catch (error) {
    console.error("Error voiding commission:", error);
    return res.status(500).json({ message: "Failed to void commission" });
  }
});

// Get all commissions with optional filters
adminRouter.get("/commissions", async (req, res) => {
  try {
    const { status, partnerId, quarter } = req.query;

    let result = await storage.getAllCommissions();

    if (partnerId) {
      result = result.filter((c) => c.partnerId === partnerId);
    }
    if (status) {
      result = result.filter((c) => c.status === status);
    }
    if (quarter) {
      result = result.filter((c) => c.payoutQuarter === quarter);
    }

    // Enrich commissions with lead contact names
    const allLeads = await storage.getAllLeads();
    const leadMap = new Map(allLeads.map((l) => [l.id, l]));
    const enriched = result.map((c) => {
      const lead = leadMap.get(c.leadId);
      return { ...c, leadContactName: lead?.contactName ?? "Unknown" };
    });

    return res.json(enriched);
  } catch (error) {
    console.error("Error fetching commissions:", error);
    return res.status(500).json({ message: "Failed to fetch commissions" });
  }
});

// Check retention and transition eligible commissions
adminRouter.post("/commissions/check-retention", async (req, res) => {
  try {
    // Find commissions where status = pending_retention
    // and createdAt + retentionDays <= now
    const allCommissions = await storage.getAllCommissions();
    const now = new Date();
    const eligibleCommissions = allCommissions.filter((c) => {
      if (c.status !== "pending_retention") return false;
      if (!c.createdAt) return false;
      const created = new Date(c.createdAt);
      const retentionMs = (c.retentionDays || 60) * 24 * 60 * 60 * 1000;
      return created.getTime() + retentionMs <= now.getTime();
    });

    let transitioned = 0;
    for (const commission of eligibleCommissions) {
      await storage.transitionCommissionStatus(commission.id, "eligible");
      transitioned++;
    }

    return res.json({ transitioned });
  } catch (error) {
    console.error("Error checking retention:", error);
    return res.status(500).json({ message: "Failed to check retention" });
  }
});

// ── Phase 6: Admin API & Payout Reports ───────────────────────────────────────

// Get all partners with stats
adminRouter.get("/partners", async (_req, res) => {
  try {
    const allPartners = await storage.getPartners();

    const partnersWithStats = await Promise.all(
      allPartners.map(async (partner) => {
        // Lead stats
        const partnerLeads = await storage.getLeadsByPartner(partner.id);
        const leadCount = partnerLeads.length;
        const convertedCount = partnerLeads.filter((l) => l.status === "converted").length;

        // Commission stats
        const partnerCommissions = await storage.getCommissionsByPartner(partner.id);
        const totalEarned = partnerCommissions
          .filter((c) => c.status === "paid")
          .reduce((sum, c) => sum + c.amount, 0);
        const pendingAmount = partnerCommissions
          .filter((c) => ["pending_retention", "eligible"].includes(c.status))
          .reduce((sum, c) => sum + c.amount, 0);

        // Agreement status
        const agreement = await storage.getAgreementByPartner(partner.id);
        const agreementSigned = agreement?.status === "signed";

        return {
          ...partner,
          agreementSigned,
          stats: {
            leadCount,
            convertedCount,
            totalEarned,
            pendingAmount,
          },
        };
      }),
    );

    return res.json(partnersWithStats);
  } catch (error) {
    console.error("Error fetching partners:", error);
    return res.status(500).json({ message: "Failed to fetch partners" });
  }
});

// Get single partner detail with leads and commissions
adminRouter.get("/partners/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const partner = await storage.getPartner(id);
    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    const partnerLeads = await storage.getLeadsByPartner(id);
    const partnerCommissions = await storage.getCommissionsByPartner(id);
    const program = await storage.getProgram(partner.programId);
    const agreement = await storage.getAgreementByPartner(id);

    // Enrich commissions with lead contact names
    const leadMap = new Map(partnerLeads.map((l) => [l.id, l]));
    const enrichedCommissions = partnerCommissions.map((c) => {
      const lead = leadMap.get(c.leadId);
      return { ...c, leadContactName: lead?.contactName ?? "Unknown" };
    });

    return res.json({
      partner,
      program,
      leads: partnerLeads,
      commissions: enrichedCommissions,
      agreementSigned: agreement?.status === "signed",
      agreementSignedAt: agreement?.signedAt ?? null,
    });
  } catch (error) {
    console.error("Error fetching partner detail:", error);
    return res.status(500).json({ message: "Failed to fetch partner detail" });
  }
});

// Approve or suspend a partner
adminRouter.patch("/partners/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["active", "suspended"].includes(status)) {
      return res.status(400).json({ message: "status must be 'active' or 'suspended'" });
    }

    const partner = await storage.getPartner(id);
    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    const updated = await storage.updatePartnerStatus(id, status);

    await storage.createAuditEntry({
      userId: req.user!.id,
      action: status === "suspended" ? "suspend_partner" : "approve_partner",
      entityType: "partner",
      entityId: id,
      details: `Partner status changed to "${status}"`,
    });

    markDirty("partners");
    return res.json(updated);
  } catch (error) {
    console.error("Error updating partner status:", error);
    return res.status(500).json({ message: "Failed to update partner status" });
  }
});

// Reset a partner's password
adminRouter.post("/partners/:id/reset-password", adminCreateLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: "newPassword is required and must be at least 8 characters" });
    }

    const partner = await storage.getPartner(id);
    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    const { hashPassword } = await import("../auth");
    const hashed = hashPassword(newPassword);
    await storage.updateUser(partner.userId, { password: hashed });

    await storage.createAuditEntry({
      userId: req.user!.id,
      action: "reset_partner_password",
      entityType: "partner",
      entityId: id,
      details: `Password reset for partner "${partner.companyName}"`,
    });

    return res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error resetting partner password:", error);
    return res.status(500).json({ message: "Failed to reset password" });
  }
});

// ── Manually Create a Partner ──────────────────────────────────────────────
adminRouter.post("/partners", async (req, res) => {
  try {
    const { username, password, companyName, contactName, email, phone, programId, paymentMethod, paymentDetails, agreementSigned } = req.body;

    if (!username || !password || !companyName || !contactName || !email || !phone || !programId || !paymentMethod) {
      return res.status(400).json({ message: "username, password, companyName, contactName, email, phone, programId, and paymentMethod are required" });
    }

    // Verify program exists
    const program = await storage.getProgram(programId);
    if (!program) return res.status(400).json({ message: "Invalid program" });

    // Check username
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) return res.status(409).json({ message: "Username already exists" });

    // Create user
    const { hashPassword } = await import("../auth");
    const hashedPassword = hashPassword(password);
    const user = await storage.createUser({ username, password: hashedPassword });
    await storage.updateUser(user.id, { role: "partner" });

    // Generate referral code
    const { randomBytes } = await import("crypto");
    let referralCode = randomBytes(5).toString("hex").toUpperCase();
    let existing = await storage.getPartnerByReferralCode(referralCode);
    while (existing) {
      referralCode = randomBytes(5).toString("hex").toUpperCase();
      existing = await storage.getPartnerByReferralCode(referralCode);
    }

    // Create partner
    const partner = await storage.createPartner({
      userId: user.id,
      programId,
      companyName,
      contactName,
      email,
      phone,
      status: agreementSigned ? "active" : "pending",
      referralCode,
      paymentMethod,
      paymentDetails: paymentDetails || null,
    });

    // If admin marks agreement as signed, create a signed agreement record
    if (agreementSigned) {
      await storage.createAgreement({
        partnerId: partner.id,
        programId,
        signNowDocumentId: "manual-admin-approval",
        status: "signed",
        sentAt: new Date(),
      });
      await storage.updateAgreementStatus(
        (await storage.getAgreementByPartner(partner.id))!.id,
        "signed",
        new Date(),
      );
    }

    await storage.createAuditEntry({
      userId: req.user!.id,
      action: "create_partner",
      entityType: "partner",
      entityId: partner.id,
      details: `Manually created partner "${companyName}" (${username})`,
    });

    markDirty("partners");
    return res.status(201).json(partner);
  } catch (error) {
    console.error("Error creating partner:", error);
    return res.status(500).json({ message: "Failed to create partner" });
  }
});

// ── Admin: Add Lead for a Partner ─────────────────────────────────────────
adminRouter.post("/partners/:id/leads", async (req, res) => {
  try {
    const { id } = req.params;
    const partner = await storage.getPartner(id);
    if (!partner) return res.status(404).json({ message: "Partner not found" });

    const { contactName, email, phone } = req.body;
    if (!contactName || !email || !phone) {
      return res.status(400).json({ message: "contactName, email, and phone are required" });
    }

    const lead = await storage.createLead({
      partnerId: partner.id,
      contactName,
      email,
      phone,
      source: "form",
      status: "new",
    });

    await storage.createAuditEntry({
      userId: req.user!.id,
      action: "create_lead_for_partner",
      entityType: "lead",
      entityId: lead.id,
      details: `Admin created lead "${contactName}" for partner "${partner.companyName}"`,
    });

    markDirty("leads");
    return res.status(201).json(lead);
  } catch (error) {
    console.error("Error creating lead for partner:", error);
    return res.status(500).json({ message: "Failed to create lead" });
  }
});

// ── Admin: Mark Partner Agreement as Signed ───────────────────────────────
adminRouter.post("/partners/:id/mark-agreement-signed", async (req, res) => {
  try {
    const { id } = req.params;
    const partner = await storage.getPartner(id);
    if (!partner) return res.status(404).json({ message: "Partner not found" });

    let agreement = await storage.getAgreementByPartner(partner.id);

    if (agreement?.status === "signed") {
      return res.json({ message: "Agreement is already signed" });
    }

    if (!agreement) {
      agreement = await storage.createAgreement({
        partnerId: partner.id,
        programId: partner.programId,
        signNowDocumentId: "manual-admin-approval",
        status: "signed",
        sentAt: new Date(),
      });
    }

    await storage.updateAgreementStatus(agreement.id, "signed", new Date());
    await storage.updatePartnerStatus(partner.id, "active");

    await storage.createAuditEntry({
      userId: req.user!.id,
      action: "mark_agreement_signed",
      entityType: "partner",
      entityId: id,
      details: `Admin manually marked agreement as signed for "${partner.companyName}"`,
    });

    markDirty("partners");
    return res.json({ message: "Agreement marked as signed, partner activated" });
  } catch (error) {
    console.error("Error marking agreement signed:", error);
    return res.status(500).json({ message: "Failed to mark agreement signed" });
  }
});

// Get all leads with optional filters, enriched with partner info
adminRouter.get("/leads", async (req, res) => {
  try {
    const { partnerId, status } = req.query;

    let result = await storage.getAllLeads();

    if (partnerId) {
      result = result.filter((l) => l.partnerId === partnerId);
    }
    if (status) {
      result = result.filter((l) => l.status === status);
    }

    // Enrich leads with partner details
    const allPartners = await storage.getPartners();
    const partnerMap = new Map(allPartners.map((p) => [p.id, p]));

    const enriched = result.map((lead) => {
      const partner = partnerMap.get(lead.partnerId);
      return {
        ...lead,
        partnerName: partner?.companyName ?? "Unknown",
        partnerContactName: partner?.contactName ?? "",
        partnerEmail: partner?.email ?? "",
        partnerStatus: partner?.status ?? "",
      };
    });

    return res.json(enriched);
  } catch (error) {
    console.error("Error fetching leads:", error);
    return res.status(500).json({ message: "Failed to fetch leads" });
  }
});

// Dashboard stats
adminRouter.get("/dashboard-stats", async (_req, res) => {
  try {
    const allPartners = await storage.getPartners();
    const activePartners = allPartners.filter((p) => p.status === "active").length;

    const allLeads = await storage.getAllLeads();
    const totalLeads = allLeads.length;
    const convertedLeads = allLeads.filter((l) => l.status === "converted").length;
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    const allCommissions = await storage.getAllCommissions();
    const pendingCommissions = allCommissions
      .filter((c) => ["pending_retention", "eligible"].includes(c.status))
      .reduce((sum, c) => sum + c.amount, 0);
    const paidCommissions = allCommissions
      .filter((c) => c.status === "paid")
      .reduce((sum, c) => sum + c.amount, 0);

    // Leads by status for chart
    const statusCounts: Record<string, number> = {};
    for (const lead of allLeads) {
      statusCounts[lead.status] = (statusCounts[lead.status] || 0) + 1;
    }
    const leadsByStatus = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

    // Monthly referrals (last 12 months)
    const now = new Date();
    const monthlyReferrals: Array<{ month: string; count: number }> = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = d.toLocaleString("en-US", { month: "short" });
      const year = d.getFullYear();
      const month = d.getMonth();
      const count = allLeads.filter((l) => {
        const ld = new Date(l.createdAt);
        return ld.getFullYear() === year && ld.getMonth() === month;
      }).length;
      monthlyReferrals.push({ month: monthKey, count });
    }

    // Monthly commissions (last 12 months)
    const monthlyCommissions: Array<{ month: string; amount: number }> = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = d.toLocaleString("en-US", { month: "short" });
      const year = d.getFullYear();
      const month = d.getMonth();
      const amount = allCommissions
        .filter((c) => {
          const cd = new Date(c.createdAt);
          return cd.getFullYear() === year && cd.getMonth() === month;
        })
        .reduce((sum, c) => sum + c.amount, 0);
      monthlyCommissions.push({ month: monthKey, amount });
    }

    // Top partners by lead count with commission data
    const partnerLeadMap = new Map<string, number>();
    const partnerConvertedMap = new Map<string, number>();
    for (const lead of allLeads) {
      if (lead.partnerId) {
        partnerLeadMap.set(lead.partnerId, (partnerLeadMap.get(lead.partnerId) || 0) + 1);
        if (lead.status === "converted") {
          partnerConvertedMap.set(lead.partnerId, (partnerConvertedMap.get(lead.partnerId) || 0) + 1);
        }
      }
    }
    const partnerCommissionMap = new Map<string, number>();
    for (const c of allCommissions) {
      if (c.partnerId) {
        partnerCommissionMap.set(c.partnerId, (partnerCommissionMap.get(c.partnerId) || 0) + c.amount);
      }
    }
    const topPartners = allPartners
      .map((p) => ({
        id: p.id,
        name: p.contactName || p.companyName,
        company: p.companyName,
        leads: partnerLeadMap.get(p.id) || 0,
        converted: partnerConvertedMap.get(p.id) || 0,
        earned: partnerCommissionMap.get(p.id) || 0,
        status: p.status,
      }))
      .sort((a, b) => b.earned - a.earned)
      .slice(0, 5);

    return res.json({
      activePartners,
      totalPartners: allPartners.length,
      totalLeads,
      convertedLeads,
      conversionRate: Math.round(conversionRate * 100) / 100,
      pendingCommissions,
      paidCommissions,
      leadsByStatus,
      monthlyReferrals,
      monthlyCommissions,
      topPartners,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
});

// Generate quarterly payout report
adminRouter.post("/payouts/generate", async (req, res) => {
  try {
    const { quarter } = req.body;

    if (!quarter || !/^\d{4}-Q[1-4]$/.test(quarter)) {
      return res.status(400).json({ message: 'quarter is required (format: "2026-Q1")' });
    }

    // Check if payout already generated for this quarter
    const existingReports = await storage.getPayoutReports();
    const alreadyGenerated = existingReports.find((r) => r.quarter === quarter);
    if (alreadyGenerated) {
      return res.status(400).json({ message: "Payout already generated for this quarter" });
    }

    // Get all eligible commissions
    const eligibleCommissions = await storage.getEligibleCommissionsForPayout();
    if (eligibleCommissions.length === 0) {
      return res.status(400).json({ message: "No eligible commissions to pay out" });
    }

    // Group by partner
    interface PartnerPayoutGroup {
      partner: Awaited<ReturnType<typeof storage.getPartner>> & {};
      commissions: typeof eligibleCommissions;
    }
    const partnerMap: Record<string, PartnerPayoutGroup> = {};

    // Fetch all partners we need
    const allPartners = await storage.getPartners();
    const partnerLookup: Record<string, typeof allPartners[number]> = {};
    for (const p of allPartners) {
      partnerLookup[p.id] = p;
    }

    for (const commission of eligibleCommissions) {
      const partner = partnerLookup[commission.partnerId];
      if (!partner) continue;

      if (!partnerMap[partner.id]) {
        partnerMap[partner.id] = { partner, commissions: [] };
      }
      partnerMap[partner.id].commissions.push(commission);
    }

    // Build CSV
    const csvLines: string[] = [
      "Partner Company,Contact Name,Email,Payment Method,Payment Details,Leads Count,Total Amount",
    ];

    let totalAmount = 0;
    let partnerCount = 0;

    const partnerIds = Object.keys(partnerMap);
    for (const pid of partnerIds) {
      const { partner, commissions: partnerCommissions } = partnerMap[pid];
      const amount = partnerCommissions.reduce((sum: number, c: typeof partnerCommissions[number]) => sum + c.amount, 0);
      totalAmount += amount;
      partnerCount++;

      // Escape CSV fields
      const escape = (val: string | null) => {
        if (!val) return "";
        if (val.includes(",") || val.includes('"') || val.includes("\n")) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      };

      csvLines.push(
        [
          escape(partner.companyName),
          escape(partner.contactName),
          escape(partner.email),
          escape(partner.paymentMethod),
          escape(partner.paymentDetails),
          partnerCommissions.length.toString(),
          (amount / 100).toFixed(2),
        ].join(","),
      );
    }

    // Mark all commissions as paid
    for (const commission of eligibleCommissions) {
      const updated = await storage.transitionCommissionStatus(commission.id, "paid");
      // Set payoutQuarter on the returned commission object
      if (updated) {
        updated.payoutQuarter = quarter;
      }
    }

    // Create payout report record
    await storage.createPayoutReport({
      quarter,
      generatedAt: new Date(),
      totalAmount,
      partnerCount,
    });

    await storage.createAuditEntry({
      userId: req.user!.id,
      action: "generate_payout",
      entityType: "payout_report",
      entityId: quarter,
      details: `Generated payout for ${quarter}: ${partnerCount} partners, $${(totalAmount / 100).toFixed(2)} total, ${eligibleCommissions.length} commissions`,
    });

    markDirty("commissions");

    // Fire-and-forget payout notifications for each partner
    for (const pid of partnerIds) {
      const { partner, commissions: partnerCommissions } = partnerMap[pid];
      const amount = partnerCommissions.reduce((sum: number, c: typeof partnerCommissions[number]) => sum + c.amount, 0);
      sendPayoutNotification(partner.email, partner.contactName, amount, quarter).catch(console.error);
    }

    const csv = csvLines.join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="payout-${quarter}.csv"`);
    return res.send(csv);
  } catch (error) {
    console.error("Error generating payout:", error);
    return res.status(500).json({ message: "Failed to generate payout" });
  }
});

// List all payout reports
adminRouter.get("/payouts", async (_req, res) => {
  try {
    const reports = await storage.getPayoutReports();
    return res.json(reports);
  } catch (error) {
    console.error("Error fetching payout reports:", error);
    return res.status(500).json({ message: "Failed to fetch payout reports" });
  }
});

// Searchable audit log
adminRouter.get("/audit-log", async (req, res) => {
  try {
    const { entityType, action, userId } = req.query;

    const filters: Record<string, string> = {};
    if (entityType) filters.entityType = entityType as string;
    if (action) filters.action = action as string;
    if (userId) filters.userId = userId as string;

    const entries = await storage.getAuditLog(
      Object.keys(filters).length > 0 ? filters : undefined,
    );

    return res.json(entries);
  } catch (error) {
    console.error("Error fetching audit log:", error);
    return res.status(500).json({ message: "Failed to fetch audit log" });
  }
});

// ── Phase 7: Google Sheets Batched Sync ─────────────────────────────────────

// Trigger a full sync manually
adminRouter.post("/sheets/sync", async (_req, res) => {
  try {
    await fullSync();
    return res.json(getSyncStatus());
  } catch (error) {
    console.error("Error triggering sheets sync:", error);
    return res.status(500).json({ message: "Failed to trigger sync" });
  }
});

// Get sync status
adminRouter.get("/sheets/status", async (_req, res) => {
  try {
    return res.json(getSyncStatus());
  } catch (error) {
    console.error("Error fetching sync status:", error);
    return res.status(500).json({ message: "Failed to fetch sync status" });
  }
});

// ── Admin Account Management ──────────────────────────────────────────────

// List all admin users
adminRouter.get("/admins", async (_req, res) => {
  try {
    const admins = await storage.getUsersByRole("admin");
    const safe = admins.map(({ password: _, ...u }) => u);
    return res.json(safe);
  } catch (error) {
    console.error("Error fetching admins:", error);
    return res.status(500).json({ message: "Failed to fetch admin accounts" });
  }
});

// Create a new admin account
adminRouter.post("/admins", adminCreateLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const existing = await storage.getUserByUsername(username);
    if (existing) {
      return res.status(409).json({ message: "Username already exists" });
    }

    const { hashPassword } = await import("../auth");
    const user = await storage.createUser({ username, password: hashPassword(password) });
    await storage.updateUser(user.id, { role: "admin" });
    user.role = "admin";

    const { password: _, ...safe } = user;
    return res.status(201).json(safe);
  } catch (error) {
    console.error("Error creating admin:", error);
    return res.status(500).json({ message: "Failed to create admin account" });
  }
});

// Delete an admin account
adminRouter.delete("/admins/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (id === req.user!.id) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    const user = await storage.getUser(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.role !== "admin") {
      return res.status(400).json({ message: "User is not an admin" });
    }

    await storage.deleteUser(id);
    return res.json({ message: "Admin account deleted" });
  } catch (error) {
    console.error("Error deleting admin:", error);
    return res.status(500).json({ message: "Failed to delete admin account" });
  }
});
