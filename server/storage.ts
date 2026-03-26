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
import { db as _db, hasDatabase } from "./db";
import { eq, and, or, gte, sql, desc } from "drizzle-orm";

// Non-null assertion — DatabaseStorage is only instantiated when hasDatabase is true
const db = _db!;
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
  getUsersByRole(role: string): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<{ password: string; role: string }>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;

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
  updatePartner(id: string, data: Partial<InsertPartner>): Promise<Partner | undefined>;

  // Leads
  createLead(data: InsertLead): Promise<Lead>;
  getLead(id: string): Promise<Lead | undefined>;
  getLeadsByPartner(partnerId: string): Promise<Lead[]>;
  getAllLeads(): Promise<Lead[]>;
  updateLeadStatus(id: string, status: string, convertedAt?: Date): Promise<Lead | undefined>;
  checkDuplicateLead(email: string, days: number, phone?: string): Promise<Lead | undefined>;

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

// ─── Commission State Machine ────────────────────────────────────────────────

const ALLOWED_COMMISSION_TRANSITIONS: Record<string, string[]> = {
  pending_retention: ["eligible", "voided"],
  eligible: ["paid", "voided"],
};

// ─── MemStorage (full implementation for dev without DB) ─────────────────────

export class MemStorage implements IStorage {
  private usersMap = new Map<string, User>();
  private contactMessagesMap = new Map<string, ContactMessage>();
  private enrollmentsMap = new Map<string, Enrollment>();
  private programsMap = new Map<string, ReferralProgram>();
  private partnersMap = new Map<string, Partner>();
  private leadsMap = new Map<string, Lead>();
  private commissionsMap = new Map<string, Commission>();
  private agreementsMap = new Map<string, PartnerAgreement>();
  private payoutReportsMap = new Map<string, PayoutReport>();
  private auditLogEntries: AuditLogEntry[] = [];

  // ── Users ────────────────────────────────────────────────────────────────

  async getUser(id: string): Promise<User | undefined> {
    return this.usersMap.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find((u) => u.username === username);
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.usersMap.values()).filter((u) => u.role === role);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id, role: "customer" };
    this.usersMap.set(id, user);
    return user;
  }

  async updateUser(id: string, data: Partial<{ password: string; role: string }>): Promise<User | undefined> {
    const user = this.usersMap.get(id);
    if (!user) return undefined;
    Object.assign(user, data);
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.usersMap.delete(id);
  }

  // ── Contact Messages ─────────────────────────────────────────────────────

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

  // ── Enrollments ──────────────────────────────────────────────────────────

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
    if (enrollment) enrollment.crcSynced = true;
  }

  async markEnrollmentSigned(id: string, signnowDocumentId: string, signnowInviteId: string): Promise<void> {
    const enrollment = this.enrollmentsMap.get(id);
    if (enrollment) {
      enrollment.signnowDocumentId = signnowDocumentId;
      enrollment.signnowInviteId = signnowInviteId;
      enrollment.signedAt = new Date();
    }
  }

  // ── Referral Programs ────────────────────────────────────────────────────

  async createProgram(data: InsertReferralProgram): Promise<ReferralProgram> {
    const id = randomUUID();
    const program: ReferralProgram = {
      id,
      name: data.name,
      commissionAmount: data.commissionAmount,
      retentionDays: data.retentionDays ?? 91,
      payoutSchedule: data.payoutSchedule,
      signnowTemplateId: data.signnowTemplateId ?? null,
      isActive: data.isActive ?? true,
      description: data.description ?? null,
      createdAt: new Date(),
    };
    this.programsMap.set(id, program);
    return program;
  }

  async getPrograms(): Promise<ReferralProgram[]> {
    return Array.from(this.programsMap.values()).sort(
      (a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0),
    );
  }

  async getProgram(id: string): Promise<ReferralProgram | undefined> {
    return this.programsMap.get(id);
  }

  async updateProgram(id: string, data: Partial<InsertReferralProgram>): Promise<ReferralProgram | undefined> {
    const program = this.programsMap.get(id);
    if (!program) return undefined;
    Object.assign(program, data);
    return program;
  }

  // ── Partners ─────────────────────────────────────────────────────────────

  async createPartner(data: InsertPartner): Promise<Partner> {
    const id = randomUUID();
    const partner: Partner = {
      id,
      userId: data.userId,
      programId: data.programId,
      companyName: data.companyName,
      contactName: data.contactName,
      email: data.email,
      phone: data.phone,
      status: data.status ?? "pending",
      referralCode: data.referralCode,
      paymentMethod: data.paymentMethod,
      paymentDetails: data.paymentDetails ?? null,
      createdAt: new Date(),
    };
    this.partnersMap.set(id, partner);
    return partner;
  }

  async getPartner(id: string): Promise<Partner | undefined> {
    return this.partnersMap.get(id);
  }

  async getPartnerByUserId(userId: string): Promise<Partner | undefined> {
    return Array.from(this.partnersMap.values()).find((p) => p.userId === userId);
  }

  async getPartnerByReferralCode(code: string): Promise<Partner | undefined> {
    return Array.from(this.partnersMap.values()).find((p) => p.referralCode === code);
  }

  async getPartners(): Promise<Partner[]> {
    return Array.from(this.partnersMap.values()).sort(
      (a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0),
    );
  }

  async updatePartnerStatus(id: string, status: string): Promise<Partner | undefined> {
    const partner = this.partnersMap.get(id);
    if (!partner) return undefined;
    partner.status = status;
    return partner;
  }

  async updatePartner(id: string, data: Partial<InsertPartner>): Promise<Partner | undefined> {
    const partner = this.partnersMap.get(id);
    if (!partner) return undefined;
    Object.assign(partner, data);
    return partner;
  }

  // ── Leads ────────────────────────────────────────────────────────────────

  async createLead(data: InsertLead): Promise<Lead> {
    const id = randomUUID();
    const lead: Lead = {
      id,
      partnerId: data.partnerId,
      contactName: data.contactName,
      email: data.email,
      phone: data.phone,
      source: data.source,
      status: data.status ?? "new",
      convertedAt: null,
      retentionStartDate: null,
      attributedAt: null,
      createdAt: new Date(),
    };
    this.leadsMap.set(id, lead);
    return lead;
  }

  async getLead(id: string): Promise<Lead | undefined> {
    return this.leadsMap.get(id);
  }

  async getLeadsByPartner(partnerId: string): Promise<Lead[]> {
    return Array.from(this.leadsMap.values())
      .filter((l) => l.partnerId === partnerId)
      .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }

  async getAllLeads(): Promise<Lead[]> {
    return Array.from(this.leadsMap.values()).sort(
      (a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0),
    );
  }

  async updateLeadStatus(id: string, status: string, convertedAt?: Date): Promise<Lead | undefined> {
    const lead = this.leadsMap.get(id);
    if (!lead) return undefined;
    lead.status = status;
    if (convertedAt) {
      lead.convertedAt = convertedAt;
      lead.retentionStartDate = convertedAt;
    }
    return lead;
  }

  async checkDuplicateLead(email: string, days: number, phone?: string): Promise<Lead | undefined> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return Array.from(this.leadsMap.values()).find(
      (l) => (l.email === email || (phone && l.phone === phone)) && l.createdAt && l.createdAt >= cutoff,
    );
  }

  // ── Commissions ──────────────────────────────────────────────────────────

  async createCommission(data: InsertCommission): Promise<Commission> {
    const id = randomUUID();
    const commission: Commission = {
      id,
      partnerId: data.partnerId,
      leadId: data.leadId,
      programId: data.programId,
      amount: data.amount,
      retentionDays: data.retentionDays,
      status: data.status ?? "pending_retention",
      eligibleAt: null,
      paidAt: null,
      payoutQuarter: null,
      voidedReason: null,
      createdAt: new Date(),
    };
    this.commissionsMap.set(id, commission);
    return commission;
  }

  async getCommissionsByPartner(partnerId: string): Promise<Commission[]> {
    return Array.from(this.commissionsMap.values())
      .filter((c) => c.partnerId === partnerId)
      .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }

  async getAllCommissions(): Promise<Commission[]> {
    return Array.from(this.commissionsMap.values()).sort(
      (a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0),
    );
  }

  async transitionCommissionStatus(id: string, newStatus: string, details?: string): Promise<Commission | undefined> {
    const commission = this.commissionsMap.get(id);
    if (!commission) throw new Error(`Commission ${id} not found`);

    const allowed = ALLOWED_COMMISSION_TRANSITIONS[commission.status];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new Error(`Invalid commission status transition: ${commission.status} -> ${newStatus}`);
    }

    commission.status = newStatus;
    if (newStatus === "eligible") commission.eligibleAt = new Date();
    else if (newStatus === "paid") commission.paidAt = new Date();
    else if (newStatus === "voided") commission.voidedReason = details || null;

    return commission;
  }

  async getEligibleCommissionsForPayout(quarter?: string): Promise<Commission[]> {
    return Array.from(this.commissionsMap.values()).filter((c) => {
      if (c.status !== "eligible") return false;
      if (quarter && c.payoutQuarter !== quarter) return false;
      return true;
    });
  }

  // ── Agreements ───────────────────────────────────────────────────────────

  async createAgreement(data: InsertPartnerAgreement): Promise<PartnerAgreement> {
    const id = randomUUID();
    const agreement: PartnerAgreement = {
      id,
      partnerId: data.partnerId,
      programId: data.programId,
      signNowDocumentId: data.signNowDocumentId,
      status: data.status ?? "sent",
      sentAt: data.sentAt,
      signedAt: data.signedAt ?? null,
    };
    this.agreementsMap.set(id, agreement);
    return agreement;
  }

  async getAgreementByPartner(partnerId: string): Promise<PartnerAgreement | undefined> {
    return Array.from(this.agreementsMap.values()).find((a) => a.partnerId === partnerId);
  }

  async updateAgreementStatus(id: string, status: string, signedAt?: Date): Promise<PartnerAgreement | undefined> {
    const agreement = this.agreementsMap.get(id);
    if (!agreement) return undefined;
    agreement.status = status;
    if (signedAt) agreement.signedAt = signedAt;
    return agreement;
  }

  // ── Payout Reports ───────────────────────────────────────────────────────

  async createPayoutReport(data: InsertPayoutReport): Promise<PayoutReport> {
    const id = randomUUID();
    const report: PayoutReport = {
      id,
      quarter: data.quarter,
      generatedAt: data.generatedAt,
      totalAmount: data.totalAmount,
      partnerCount: data.partnerCount,
    };
    this.payoutReportsMap.set(id, report);
    return report;
  }

  async getPayoutReports(): Promise<PayoutReport[]> {
    return Array.from(this.payoutReportsMap.values()).sort(
      (a, b) => b.generatedAt.getTime() - a.generatedAt.getTime(),
    );
  }

  // ── Audit Log ────────────────────────────────────────────────────────────

  async createAuditEntry(data: InsertAuditLog): Promise<AuditLogEntry> {
    const id = randomUUID();
    const entry: AuditLogEntry = {
      id,
      userId: data.userId ?? null,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      details: data.details ?? null,
      createdAt: new Date(),
    };
    this.auditLogEntries.unshift(entry);
    return entry;
  }

  async getAuditLog(filters?: AuditLogFilters): Promise<AuditLogEntry[]> {
    let entries = this.auditLogEntries;
    if (filters?.userId) entries = entries.filter((e) => e.userId === filters.userId);
    if (filters?.entityType) entries = entries.filter((e) => e.entityType === filters.entityType);
    if (filters?.entityId) entries = entries.filter((e) => e.entityId === filters.entityId);
    if (filters?.action) entries = entries.filter((e) => e.action === filters.action);
    return entries;
  }
}

// ─── DatabaseStorage ─────────────────────────────────────────────────────────

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

  async getUsersByRole(role: string): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, role));
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<{ password: string; role: string }>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount ?? 0) > 0;
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

  async updatePartner(id: string, data: Partial<InsertPartner>): Promise<Partner | undefined> {
    const [partner] = await db.update(partners).set(data).where(eq(partners.id, id)).returning();
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
      updates.retentionStartDate = convertedAt;
    }
    const [lead] = await db.update(leads).set(updates).where(eq(leads.id, id)).returning();
    return lead;
  }

  async checkDuplicateLead(email: string, days: number, phone?: string): Promise<Lead | undefined> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const emailOrPhone = phone
      ? or(eq(leads.email, email), eq(leads.phone, phone))
      : eq(leads.email, email);
    const [lead] = await db.select().from(leads).where(
      and(emailOrPhone, gte(leads.createdAt, cutoff)),
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
    const [current] = await db.select().from(commissions).where(eq(commissions.id, id));
    if (!current) throw new Error(`Commission ${id} not found`);

    const allowed = ALLOWED_COMMISSION_TRANSITIONS[current.status];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new Error(`Invalid commission status transition: ${current.status} -> ${newStatus}`);
    }

    const updates: Record<string, unknown> = { status: newStatus };
    if (newStatus === "eligible") updates.eligibleAt = new Date();
    else if (newStatus === "paid") updates.paidAt = new Date();
    else if (newStatus === "voided") updates.voidedReason = details || null;

    const [updated] = await db.update(commissions).set(updates).where(eq(commissions.id, id)).returning();
    return updated;
  }

  async getEligibleCommissionsForPayout(quarter?: string): Promise<Commission[]> {
    if (quarter) {
      return db.select().from(commissions).where(
        and(eq(commissions.status, "eligible"), eq(commissions.payoutQuarter, quarter)),
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
    if (signedAt) updates.signedAt = signedAt;
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
    if (filters?.userId) conditions.push(eq(auditLog.userId, filters.userId));
    if (filters?.entityType) conditions.push(eq(auditLog.entityType, filters.entityType));
    if (filters?.entityId) conditions.push(eq(auditLog.entityId, filters.entityId));
    if (filters?.action) conditions.push(eq(auditLog.action, filters.action));

    if (conditions.length > 0) {
      return db.select().from(auditLog).where(and(...conditions)).orderBy(desc(auditLog.createdAt));
    }
    return db.select().from(auditLog).orderBy(desc(auditLog.createdAt));
  }
}

// ─── Seed MemStorage with test data ──────────────────────────────────────────

async function seedMemStorage(mem: MemStorage) {
  const { hashPassword } = await import("./auth");

  // Admin user: aaron / admin123
  const admin = await mem.createUser({ username: "aaron", password: hashPassword("admin123") });
  await mem.updateUser(admin.id, { role: "admin" });

  // Default referral program
  const program = await mem.createProgram({
    name: "Standard $50",
    commissionAmount: 5000,
    retentionDays: 91,
    payoutSchedule: "quarterly",
    isActive: true,
    description: "Standard referral program — $50 per qualified referral after 91-day retention",
    signnowTemplateId: null,
  });

  // Test partner user: testpartner / partner123
  const partnerUser = await mem.createUser({ username: "testpartner", password: hashPassword("partner123") });
  await mem.updateUser(partnerUser.id, { role: "partner" });

  const partner = await mem.createPartner({
    userId: partnerUser.id,
    programId: program.id,
    companyName: "Test Referral Co",
    contactName: "Jane Smith",
    email: "jane@testreferral.com",
    phone: "(555) 987-6543",
    status: "active",
    referralCode: "TESTREF001",
    paymentMethod: "paypal",
    paymentDetails: "jane@testreferral.com",
  });

  // Seed some test leads for the partner
  const lead1 = await mem.createLead({
    partnerId: partner.id,
    contactName: "John Doe",
    email: "john.doe@example.com",
    phone: "(555) 111-2222",
    source: "form",
    status: "new",
  });

  const lead2 = await mem.createLead({
    partnerId: partner.id,
    contactName: "Sarah Connor",
    email: "sarah@example.com",
    phone: "(555) 333-4444",
    source: "referral_link",
    status: "contacted",
  });

  const lead3 = await mem.createLead({
    partnerId: partner.id,
    contactName: "Mike Johnson",
    email: "mike.j@example.com",
    phone: "(555) 555-6666",
    source: "form",
    status: "converted",
  });
  if (lead3.id) {
    lead3.convertedAt = new Date(Date.now() - 70 * 24 * 60 * 60 * 1000); // 70 days ago
  }

  // Seed a commission for the converted lead
  await mem.createCommission({
    partnerId: partner.id,
    leadId: lead3.id,
    programId: program.id,
    amount: 5000,
    retentionDays: 91,
    status: "eligible",
  });

  console.log("[seed] MemStorage seeded with test data");
}

// ─── Export ──────────────────────────────────────────────────────────────────

let storage: IStorage;

if (hasDatabase) {
  storage = new DatabaseStorage();
} else {
  const mem = new MemStorage();
  if (process.env.NODE_ENV !== "production") {
    seedMemStorage(mem).catch((err) => console.error("MemStorage seed failed:", err));
  }
  storage = mem;
}

export { storage };
