import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

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

// Enrollment schema
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
