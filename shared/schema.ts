import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ─── Users ───────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("customer"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ─── Contact Messages ────────────────────────────────────────────────────────

export const contactMessages = pgTable("contact_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertContactMessageSchema = createInsertSchema(contactMessages).omit({
  id: true,
  createdAt: true,
}).extend({
  phone: z.string().optional().nullable().transform((val) => val === "" ? null : val),
});

export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;
export type ContactMessage = typeof contactMessages.$inferSelect;

// ─── Enrollments ─────────────────────────────────────────────────────────────

export const enrollments = pgTable("enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  state: text("state").notNull(),
  croaAcknowledged: boolean("croa_acknowledged").notNull().default(false),
  signnowDocumentId: text("signnow_document_id"),
  signnowInviteId: text("signnow_invite_id"),
  signedAt: timestamp("signed_at"),
  ipAddress: text("ip_address").notNull(),
  userAgent: text("user_agent"),
  crcSynced: boolean("crc_synced").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEnrollmentSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  state: z.string().min(2, "State is required"),
  croaAcknowledged: z.literal(true, { errorMap: () => ({ message: "You must acknowledge the CROA disclosure" }) }),
  signnowDocumentId: z.string().optional(),
  signnowInviteId: z.string().optional(),
});

export const createSignNowInviteSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
});

export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type Enrollment = typeof enrollments.$inferSelect;

// ─── Referral Programs ───────────────────────────────────────────────────────

export const referralPrograms = pgTable("referral_programs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  commissionAmount: integer("commission_amount").notNull(),
  retentionDays: integer("retention_days").notNull().default(60),
  payoutSchedule: text("payout_schedule").notNull(),
  signnowTemplateId: text("signnow_template_id"),
  isActive: boolean("is_active").notNull().default(true),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReferralProgramSchema = createInsertSchema(referralPrograms).omit({
  id: true,
  createdAt: true,
});

export type InsertReferralProgram = z.infer<typeof insertReferralProgramSchema>;
export type ReferralProgram = typeof referralPrograms.$inferSelect;

// ─── Partners ────────────────────────────────────────────────────────────────

export const partners = pgTable("partners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  programId: varchar("program_id").notNull().references(() => referralPrograms.id),
  companyName: text("company_name").notNull(),
  contactName: text("contact_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  status: text("status").notNull().default("pending"),
  referralCode: varchar("referral_code", { length: 10 }).notNull().unique(),
  paymentMethod: text("payment_method").notNull(),
  paymentDetails: text("payment_details"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPartnerSchema = createInsertSchema(partners).omit({
  id: true,
  createdAt: true,
});

export type InsertPartner = z.infer<typeof insertPartnerSchema>;
export type Partner = typeof partners.$inferSelect;

// ─── Leads ───────────────────────────────────────────────────────────────────

export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: varchar("partner_id").notNull().references(() => partners.id),
  contactName: text("contact_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  source: text("source").notNull(),
  status: text("status").notNull().default("new"),
  convertedAt: timestamp("converted_at"),
  retentionStartDate: timestamp("retention_start_date"),
  attributedAt: timestamp("attributed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
});

export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;

// ─── Commissions ─────────────────────────────────────────────────────────────

export const commissions = pgTable("commissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: varchar("partner_id").notNull().references(() => partners.id),
  leadId: varchar("lead_id").notNull().references(() => leads.id),
  programId: varchar("program_id").notNull().references(() => referralPrograms.id),
  amount: integer("amount").notNull(),
  retentionDays: integer("retention_days").notNull(),
  status: text("status").notNull().default("pending_retention"),
  eligibleAt: timestamp("eligible_at"),
  paidAt: timestamp("paid_at"),
  payoutQuarter: text("payout_quarter"),
  voidedReason: text("voided_reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCommissionSchema = createInsertSchema(commissions).omit({
  id: true,
  createdAt: true,
});

export type InsertCommission = z.infer<typeof insertCommissionSchema>;
export type Commission = typeof commissions.$inferSelect;

// ─── Partner Agreements ──────────────────────────────────────────────────────

export const partnerAgreements = pgTable("partner_agreements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: varchar("partner_id").notNull().references(() => partners.id),
  programId: varchar("program_id").notNull().references(() => referralPrograms.id),
  signNowDocumentId: text("signnow_document_id").notNull(),
  status: text("status").notNull().default("sent"),
  sentAt: timestamp("sent_at").notNull(),
  signedAt: timestamp("signed_at"),
});

export const insertPartnerAgreementSchema = createInsertSchema(partnerAgreements).omit({
  id: true,
});

export type InsertPartnerAgreement = z.infer<typeof insertPartnerAgreementSchema>;
export type PartnerAgreement = typeof partnerAgreements.$inferSelect;

// ─── Payout Reports ─────────────────────────────────────────────────────────

export const payoutReports = pgTable("payout_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quarter: text("quarter").notNull(),
  generatedAt: timestamp("generated_at").notNull(),
  totalAmount: integer("total_amount").notNull(),
  partnerCount: integer("partner_count").notNull(),
});

export const insertPayoutReportSchema = createInsertSchema(payoutReports).omit({
  id: true,
});

export type InsertPayoutReport = z.infer<typeof insertPayoutReportSchema>;
export type PayoutReport = typeof payoutReports.$inferSelect;

// ─── Audit Log ───────────────────────────────────────────────────────────────

export const auditLog = pgTable("audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: varchar("entity_id").notNull(),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAuditLogSchema = createInsertSchema(auditLog).omit({
  id: true,
  createdAt: true,
});

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLogEntry = typeof auditLog.$inferSelect;
