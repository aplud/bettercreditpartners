import { Router } from "express";
import { requireAuth, requireRole } from "../auth";
import { storage } from "../storage";

export const adminRouter = Router();

// All admin routes require admin role
adminRouter.use(requireAuth, requireRole("admin"));

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
