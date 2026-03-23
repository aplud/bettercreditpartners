import { Router } from "express";
import { requireAuth, requireRole } from "../auth";
import { storage } from "../storage";
import { db } from "../db";
import { commissions, partners, leads, referralPrograms } from "@shared/schema";
import { eq, and, sql, count } from "drizzle-orm";
import { markDirty, fullSync, getSyncStatus } from "../services/google-sheets";

export const adminRouter = Router();

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

// Update lead status
adminRouter.post("/leads/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "status is required" });
    }

    const lead = await storage.getLead(id);
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    // Validate transitions: new->contacted, contacted->converted, any->lost
    const allowedTransitions: Record<string, string[]> = {
      new: ["contacted", "lost"],
      contacted: ["converted", "lost"],
      converted: ["lost"],
      lost: ["lost"],
    };

    const allowed = allowedTransitions[lead.status];
    if (!allowed || !allowed.includes(status)) {
      return res.status(400).json({
        message: `Invalid status transition: ${lead.status} -> ${status}`,
      });
    }

    const convertedAt = status === "converted" ? new Date() : undefined;
    const updated = await storage.updateLeadStatus(id, status, convertedAt);

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

    // Update lead status to converted
    const now = new Date();
    const updated = await storage.updateLeadStatus(id, "converted", now);

    // Set retentionStartDate on the lead
    await db
      .update(leads)
      .set({ retentionStartDate: now })
      .where(eq(leads.id, id));

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
      details: `Lead converted. Commission ${commission.id} created for $${program.commissionAmount} with ${program.retentionDays}-day retention.`,
    });

    markDirty("leads");
    markDirty("commissions");
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

    const conditions = [];
    if (status) {
      conditions.push(eq(commissions.status, status as string));
    }
    if (partnerId) {
      conditions.push(eq(commissions.partnerId, partnerId as string));
    }
    if (quarter) {
      conditions.push(eq(commissions.payoutQuarter, quarter as string));
    }

    let result;
    if (conditions.length > 0) {
      result = await db
        .select()
        .from(commissions)
        .where(and(...conditions))
        .orderBy(sql`${commissions.createdAt} desc`);
    } else {
      result = await storage.getAllCommissions();
    }

    return res.json(result);
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

        return {
          ...partner,
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

    return res.json({
      partner,
      program,
      leads: partnerLeads,
      commissions: partnerCommissions,
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

// Get all leads with optional filters
adminRouter.get("/leads", async (req, res) => {
  try {
    const { partnerId, status } = req.query;

    const conditions = [];
    if (partnerId) {
      conditions.push(eq(leads.partnerId, partnerId as string));
    }
    if (status) {
      conditions.push(eq(leads.status, status as string));
    }

    let result;
    if (conditions.length > 0) {
      result = await db
        .select()
        .from(leads)
        .where(and(...conditions))
        .orderBy(sql`${leads.createdAt} desc`);
    } else {
      result = await storage.getAllLeads();
    }

    return res.json(result);
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

    return res.json({
      activePartners,
      totalLeads,
      convertedLeads,
      conversionRate: Math.round(conversionRate * 100) / 100,
      pendingCommissions,
      paidCommissions,
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
          amount.toString(),
        ].join(","),
      );
    }

    // Mark all commissions as paid
    for (const commission of eligibleCommissions) {
      await storage.transitionCommissionStatus(commission.id, "paid");
      // Set payoutQuarter
      await db
        .update(commissions)
        .set({ payoutQuarter: quarter })
        .where(eq(commissions.id, commission.id));
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
      details: `Generated payout for ${quarter}: ${partnerCount} partners, $${totalAmount} total, ${eligibleCommissions.length} commissions`,
    });

    markDirty("commissions");
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
