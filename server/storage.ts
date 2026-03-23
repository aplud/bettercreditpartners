import {
  type User, type InsertUser,
  type ContactMessage, type InsertContactMessage,
  type Enrollment,
  type ReferralProgram, type InsertReferralProgram,
  type Partner, type InsertPartner,
  type Lead, type InsertLead,
  type Commission, type InsertCommission,
  type PartnerAgreement, type InsertPartnerAgreement,
  type PayoutReport, type InsertPayoutReport,
  type AuditLogEntry, type InsertAuditLog,
  users, contactMessages, enrollments,
  referralPrograms, partners, leads, commissions,
  partnerAgreements, payoutReports, auditLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, sql, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

// ─── Types ───────────────────────────────────────────────────────────────────

interface EnrollmentInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  state: string;
  croaAcknowledged: true;
  signnowDocumentId?: string;
  signnowInviteId?: string;
  ipAddress: string;
  userAgent: string;
}

interface AuditLogFilters {
  userId?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
}

// ─── IStorage Interface ──────────────────────────────────────────────────────

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Contact Messages
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
  getContactMessages(): Promise<ContactMessage[]>;

  // Enrollments
  createEnrollment(data: EnrollmentInput): Promise<Enrollment>;
  markEnrollmentSynced(id: string): Promise<void>;
  markEnrollmentSigned(id: string, signnowDocumentId: string, signnowInviteId: string): Promise<void>;

  // Referral Programs
  createProgram(data: InsertReferralProgram): Promise<ReferralProgram>;
  getPrograms(): Promise<ReferralProgram[]>;
  getProgram(id: string): Promise<ReferralProgram | undefined>;
  updateProgram(id: string, data: Partial<InsertReferralProgram>): Promise<ReferralProgram | undefined>;

  // Partners
  createPartner(data: InsertPartner): Promise<Partner>;
  getPartner(id: string): Promise<Partner | undefined>;
  getPartnerByUserId(userId: string): Promise<Partner | undefined>;
  getPartnerByReferralCode(code: string): Promise<Partner | undefined>;
  getPartners(): Promise<Partner[]>;
  updatePartnerStatus(id: string, status: string): Promise<Partner | undefined>;

  // Leads
  createLead(data: InsertLead): Promise<Lead>;
  getLead(id: string): Promise<Lead | undefined>;
  getLeadsByPartner(partnerId: string): Promise<Lead[]>;
  getAllLeads(): Promise<Lead[]>;
  updateLeadStatus(id: string, status: string, convertedAt?: Date): Promise<Lead | undefined>;
  checkDuplicateLead(email: string, days: number): Promise<Lead | undefined>;

  // Commissions
  createCommission(data: InsertCommission): Promise<Commission>;
  getCommissionsByPartner(partnerId: string): Promise<Commission[]>;
  getAllCommissions(): Promise<Commission[]>;
  transitionCommissionStatus(id: string, newStatus: string, details?: string): Promise<Commission | undefined>;
  getEligibleCommissionsForPayout(quarter?: string): Promise<Commission[]>;

  // Agreements
  createAgreement(data: InsertPartnerAgreement): Promise<PartnerAgreement>;
  getAgreementByPartner(partnerId: string): Promise<PartnerAgreement | undefined>;
  updateAgreementStatus(id: string, status: string, signedAt?: Date): Promise<PartnerAgreement | undefined>;

  // Payouts
  createPayoutReport(data: InsertPayoutReport): Promise<PayoutReport>;
  getPayoutReports(): Promise<PayoutReport[]>;

  // Audit
  createAuditEntry(data: InsertAuditLog): Promise<AuditLogEntry>;
  getAuditLog(filters?: AuditLogFilters): Promise<AuditLogEntry[]>;
}

// ─── MemStorage (kept for reference) ─────────────────────────────────────────

export class MemStorage implements IStorage {
  private usersMap: Map<string, User>;
  private contactMessagesMap: Map<string, ContactMessage>;
  private enrollmentsMap: Map<string, Enrollment>;

  constructor() {
    this.usersMap = new Map();
    this.contactMessagesMap = new Map();
    this.enrollmentsMap = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.usersMap.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id, role: "customer" };
    this.usersMap.set(id, user);
    return user;
  }

  async createContactMessage(insertMessage: InsertContactMessage): Promise<ContactMessage> {
    const id = randomUUID();
    const message: ContactMessage = {
      ...insertMessage,
      id,
      phone: insertMessage.phone ?? null,
      createdAt: new Date(),
    };
    this.contactMessagesMap.set(id, message);
    return message;
  }

  async getContactMessages(): Promise<ContactMessage[]> {
    return Array.from(this.contactMessagesMap.values());
  }

  async createEnrollment(data: EnrollmentInput): Promise<Enrollment> {
    const id = randomUUID();
    const enrollment: Enrollment = {
      id,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      state: data.state,
      croaAcknowledged: data.croaAcknowledged,
      signnowDocumentId: data.signnowDocumentId || null,
      signnowInviteId: data.signnowInviteId || null,
      signedAt: null,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      crcSynced: false,
      createdAt: new Date(),
    };
    this.enrollmentsMap.set(id, enrollment);
    return enrollment;
  }

  async markEnrollmentSynced(id: string): Promise<void> {
    const enrollment = this.enrollmentsMap.get(id);
    if (enrollment) {
      enrollment.crcSynced = true;
    }
  }

  async markEnrollmentSigned(id: string, signnowDocumentId: string, signnowInviteId: string): Promise<void> {
    const enrollment = this.enrollmentsMap.get(id);
    if (enrollment) {
      enrollment.signnowDocumentId = signnowDocumentId;
      enrollment.signnowInviteId = signnowInviteId;
      enrollment.signedAt = new Date();
    }
  }

  // Stub implementations for new methods — MemStorage is kept for reference only.
  async createProgram(_data: InsertReferralProgram): Promise<ReferralProgram> { throw new Error("MemStorage: not implemented"); }
  async getPrograms(): Promise<ReferralProgram[]> { throw new Error("MemStorage: not implemented"); }
  async getProgram(_id: string): Promise<ReferralProgram | undefined> { throw new Error("MemStorage: not implemented"); }
  async updateProgram(_id: string, _data: Partial<InsertReferralProgram>): Promise<ReferralProgram | undefined> { throw new Error("MemStorage: not implemented"); }
  async createPartner(_data: InsertPartner): Promise<Partner> { throw new Error("MemStorage: not implemented"); }
  async getPartner(_id: string): Promise<Partner | undefined> { throw new Error("MemStorage: not implemented"); }
  async getPartnerByUserId(_userId: string): Promise<Partner | undefined> { throw new Error("MemStorage: not implemented"); }
  async getPartnerByReferralCode(_code: string): Promise<Partner | undefined> { throw new Error("MemStorage: not implemented"); }
  async getPartners(): Promise<Partner[]> { throw new Error("MemStorage: not implemented"); }
  async updatePartnerStatus(_id: string, _status: string): Promise<Partner | undefined> { throw new Error("MemStorage: not implemented"); }
  async createLead(_data: InsertLead): Promise<Lead> { throw new Error("MemStorage: not implemented"); }
  async getLead(_id: string): Promise<Lead | undefined> { throw new Error("MemStorage: not implemented"); }
  async getLeadsByPartner(_partnerId: string): Promise<Lead[]> { throw new Error("MemStorage: not implemented"); }
  async getAllLeads(): Promise<Lead[]> { throw new Error("MemStorage: not implemented"); }
  async updateLeadStatus(_id: string, _status: string, _convertedAt?: Date): Promise<Lead | undefined> { throw new Error("MemStorage: not implemented"); }
  async checkDuplicateLead(_email: string, _days: number): Promise<Lead | undefined> { throw new Error("MemStorage: not implemented"); }
  async createCommission(_data: InsertCommission): Promise<Commission> { throw new Error("MemStorage: not implemented"); }
  async getCommissionsByPartner(_partnerId: string): Promise<Commission[]> { throw new Error("MemStorage: not implemented"); }
  async getAllCommissions(): Promise<Commission[]> { throw new Error("MemStorage: not implemented"); }
  async transitionCommissionStatus(_id: string, _newStatus: string, _details?: string): Promise<Commission | undefined> { throw new Error("MemStorage: not implemented"); }
  async getEligibleCommissionsForPayout(_quarter?: string): Promise<Commission[]> { throw new Error("MemStorage: not implemented"); }
  async createAgreement(_data: InsertPartnerAgreement): Promise<PartnerAgreement> { throw new Error("MemStorage: not implemented"); }
  async getAgreementByPartner(_partnerId: string): Promise<PartnerAgreement | undefined> { throw new Error("MemStorage: not implemented"); }
  async updateAgreementStatus(_id: string, _status: string, _signedAt?: Date): Promise<PartnerAgreement | undefined> { throw new Error("MemStorage: not implemented"); }
  async createPayoutReport(_data: InsertPayoutReport): Promise<PayoutReport> { throw new Error("MemStorage: not implemented"); }
  async getPayoutReports(): Promise<PayoutReport[]> { throw new Error("MemStorage: not implemented"); }
  async createAuditEntry(_data: InsertAuditLog): Promise<AuditLogEntry> { throw new Error("MemStorage: not implemented"); }
  async getAuditLog(_filters?: AuditLogFilters): Promise<AuditLogEntry[]> { throw new Error("MemStorage: not implemented"); }
}

// ─── DatabaseStorage ─────────────────────────────────────────────────────────

const ALLOWED_COMMISSION_TRANSITIONS: Record<string, string[]> = {
  pending_retention: ["eligible", "voided"],
  eligible: ["paid", "voided"],
};

export class DatabaseStorage implements IStorage {

  // ── Users ────────────────────────────────────────────────────────────────

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // ── Contact Messages ─────────────────────────────────────────────────────

  async createContactMessage(insertMessage: InsertContactMessage): Promise<ContactMessage> {
    const [message] = await db.insert(contactMessages).values(insertMessage).returning();
    return message;
  }

  async getContactMessages(): Promise<ContactMessage[]> {
    return db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
  }

  // ── Enrollments ──────────────────────────────────────────────────────────

  async createEnrollment(data: EnrollmentInput): Promise<Enrollment> {
    const [enrollment] = await db.insert(enrollments).values({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      state: data.state,
      croaAcknowledged: data.croaAcknowledged,
      signnowDocumentId: data.signnowDocumentId || null,
      signnowInviteId: data.signnowInviteId || null,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    }).returning();
    return enrollment;
  }

  async markEnrollmentSynced(id: string): Promise<void> {
    await db.update(enrollments).set({ crcSynced: true }).where(eq(enrollments.id, id));
  }

  async markEnrollmentSigned(id: string, signnowDocumentId: string, signnowInviteId: string): Promise<void> {
    await db.update(enrollments).set({
      signnowDocumentId,
      signnowInviteId,
      signedAt: new Date(),
    }).where(eq(enrollments.id, id));
  }

  // ── Referral Programs ────────────────────────────────────────────────────

  async createProgram(data: InsertReferralProgram): Promise<ReferralProgram> {
    const [program] = await db.insert(referralPrograms).values(data).returning();
    return program;
  }

  async getPrograms(): Promise<ReferralProgram[]> {
    return db.select().from(referralPrograms).orderBy(desc(referralPrograms.createdAt));
  }

  async getProgram(id: string): Promise<ReferralProgram | undefined> {
    const [program] = await db.select().from(referralPrograms).where(eq(referralPrograms.id, id));
    return program;
  }

  async updateProgram(id: string, data: Partial<InsertReferralProgram>): Promise<ReferralProgram | undefined> {
    const [program] = await db.update(referralPrograms).set(data).where(eq(referralPrograms.id, id)).returning();
    return program;
  }

  // ── Partners ─────────────────────────────────────────────────────────────

  async createPartner(data: InsertPartner): Promise<Partner> {
    const [partner] = await db.insert(partners).values(data).returning();
    return partner;
  }

  async getPartner(id: string): Promise<Partner | undefined> {
    const [partner] = await db.select().from(partners).where(eq(partners.id, id));
    return partner;
  }

  async getPartnerByUserId(userId: string): Promise<Partner | undefined> {
    const [partner] = await db.select().from(partners).where(eq(partners.userId, userId));
    return partner;
  }

  async getPartnerByReferralCode(code: string): Promise<Partner | undefined> {
    const [partner] = await db.select().from(partners).where(eq(partners.referralCode, code));
    return partner;
  }

  async getPartners(): Promise<Partner[]> {
    return db.select().from(partners).orderBy(desc(partners.createdAt));
  }

  async updatePartnerStatus(id: string, status: string): Promise<Partner | undefined> {
    const [partner] = await db.update(partners).set({ status }).where(eq(partners.id, id)).returning();
    return partner;
  }

  // ── Leads ────────────────────────────────────────────────────────────────

  async createLead(data: InsertLead): Promise<Lead> {
    const [lead] = await db.insert(leads).values(data).returning();
    return lead;
  }

  async getLead(id: string): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead;
  }

  async getLeadsByPartner(partnerId: string): Promise<Lead[]> {
    return db.select().from(leads).where(eq(leads.partnerId, partnerId)).orderBy(desc(leads.createdAt));
  }

  async getAllLeads(): Promise<Lead[]> {
    return db.select().from(leads).orderBy(desc(leads.createdAt));
  }

  async updateLeadStatus(id: string, status: string, convertedAt?: Date): Promise<Lead | undefined> {
    const updates: Record<string, unknown> = { status };
    if (convertedAt) {
      updates.convertedAt = convertedAt;
    }
    const [lead] = await db.update(leads).set(updates).where(eq(leads.id, id)).returning();
    return lead;
  }

  async checkDuplicateLead(email: string, days: number): Promise<Lead | undefined> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const [lead] = await db.select().from(leads).where(
      and(
        eq(leads.email, email),
        gte(leads.createdAt, cutoff),
      ),
    );
    return lead;
  }

  // ── Commissions ──────────────────────────────────────────────────────────

  async createCommission(data: InsertCommission): Promise<Commission> {
    const [commission] = await db.insert(commissions).values(data).returning();
    return commission;
  }

  async getCommissionsByPartner(partnerId: string): Promise<Commission[]> {
    return db.select().from(commissions).where(eq(commissions.partnerId, partnerId)).orderBy(desc(commissions.createdAt));
  }

  async getAllCommissions(): Promise<Commission[]> {
    return db.select().from(commissions).orderBy(desc(commissions.createdAt));
  }

  async transitionCommissionStatus(id: string, newStatus: string, details?: string): Promise<Commission | undefined> {
    // Fetch current commission
    const [current] = await db.select().from(commissions).where(eq(commissions.id, id));
    if (!current) {
      throw new Error(`Commission ${id} not found`);
    }

    // Validate transition
    const allowed = ALLOWED_COMMISSION_TRANSITIONS[current.status];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new Error(`Invalid commission status transition: ${current.status} -> ${newStatus}`);
    }

    const updates: Record<string, unknown> = { status: newStatus };

    if (newStatus === "eligible") {
      updates.eligibleAt = new Date();
    } else if (newStatus === "paid") {
      updates.paidAt = new Date();
    } else if (newStatus === "voided") {
      updates.voidedReason = details || null;
    }

    const [updated] = await db.update(commissions).set(updates).where(eq(commissions.id, id)).returning();
    return updated;
  }

  async getEligibleCommissionsForPayout(quarter?: string): Promise<Commission[]> {
    if (quarter) {
      return db.select().from(commissions).where(
        and(
          eq(commissions.status, "eligible"),
          eq(commissions.payoutQuarter, quarter),
        ),
      );
    }
    return db.select().from(commissions).where(eq(commissions.status, "eligible"));
  }

  // ── Agreements ───────────────────────────────────────────────────────────

  async createAgreement(data: InsertPartnerAgreement): Promise<PartnerAgreement> {
    const [agreement] = await db.insert(partnerAgreements).values(data).returning();
    return agreement;
  }

  async getAgreementByPartner(partnerId: string): Promise<PartnerAgreement | undefined> {
    const [agreement] = await db.select().from(partnerAgreements).where(eq(partnerAgreements.partnerId, partnerId));
    return agreement;
  }

  async updateAgreementStatus(id: string, status: string, signedAt?: Date): Promise<PartnerAgreement | undefined> {
    const updates: Record<string, unknown> = { status };
    if (signedAt) {
      updates.signedAt = signedAt;
    }
    const [agreement] = await db.update(partnerAgreements).set(updates).where(eq(partnerAgreements.id, id)).returning();
    return agreement;
  }

  // ── Payout Reports ───────────────────────────────────────────────────────

  async createPayoutReport(data: InsertPayoutReport): Promise<PayoutReport> {
    const [report] = await db.insert(payoutReports).values(data).returning();
    return report;
  }

  async getPayoutReports(): Promise<PayoutReport[]> {
    return db.select().from(payoutReports).orderBy(desc(payoutReports.generatedAt));
  }

  // ── Audit Log ────────────────────────────────────────────────────────────

  async createAuditEntry(data: InsertAuditLog): Promise<AuditLogEntry> {
    const [entry] = await db.insert(auditLog).values(data).returning();
    return entry;
  }

  async getAuditLog(filters?: AuditLogFilters): Promise<AuditLogEntry[]> {
    const conditions = [];
    if (filters?.userId) {
      conditions.push(eq(auditLog.userId, filters.userId));
    }
    if (filters?.entityType) {
      conditions.push(eq(auditLog.entityType, filters.entityType));
    }
    if (filters?.entityId) {
      conditions.push(eq(auditLog.entityId, filters.entityId));
    }
    if (filters?.action) {
      conditions.push(eq(auditLog.action, filters.action));
    }

    if (conditions.length > 0) {
      return db.select().from(auditLog).where(and(...conditions)).orderBy(desc(auditLog.createdAt));
    }
    return db.select().from(auditLog).orderBy(desc(auditLog.createdAt));
  }
}

// ─── Export ──────────────────────────────────────────────────────────────────

export const storage = new DatabaseStorage();
