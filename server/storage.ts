import { type User, type InsertUser, type ContactMessage, type InsertContactMessage, type Enrollment } from "@shared/schema";
import { randomUUID } from "crypto";

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

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
  getContactMessages(): Promise<ContactMessage[]>;
  createEnrollment(data: EnrollmentInput): Promise<Enrollment>;
  markEnrollmentSynced(id: string): Promise<void>;
  markEnrollmentSigned(id: string, signnowDocumentId: string, signnowInviteId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private contactMessages: Map<string, ContactMessage>;
  private enrollments: Map<string, Enrollment>;

  constructor() {
    this.users = new Map();
    this.contactMessages = new Map();
    this.enrollments = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
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
    this.contactMessages.set(id, message);
    return message;
  }

  async getContactMessages(): Promise<ContactMessage[]> {
    return Array.from(this.contactMessages.values());
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
    this.enrollments.set(id, enrollment);
    return enrollment;
  }

  async markEnrollmentSynced(id: string): Promise<void> {
    const enrollment = this.enrollments.get(id);
    if (enrollment) {
      enrollment.crcSynced = true;
    }
  }

  async markEnrollmentSigned(id: string, signnowDocumentId: string, signnowInviteId: string): Promise<void> {
    const enrollment = this.enrollments.get(id);
    if (enrollment) {
      enrollment.signnowDocumentId = signnowDocumentId;
      enrollment.signnowInviteId = signnowInviteId;
      enrollment.signedAt = new Date();
    }
  }
}

export const storage = new MemStorage();
