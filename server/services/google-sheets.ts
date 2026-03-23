import { google } from "googleapis";
import { db } from "../db";
import { partners, leads, commissions, referralPrograms } from "@shared/schema";
import { eq } from "drizzle-orm";

// Service configuration
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

// Dirty flags for batched sync
let dirtyTables = new Set<string>();
let lastSyncTime: Date | null = null;
let lastSyncError: string | null = null;

function getAuth() {
  const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!credentials) return null;

  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(credentials),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return auth;
}

function getSheetsClient() {
  const auth = getAuth();
  if (!auth) return null;
  return google.sheets({ version: "v4", auth });
}

// Mark a table as needing sync
export function markDirty(table: "partners" | "leads" | "commissions") {
  dirtyTables.add(table);
}

// Sync a single table to its Sheet tab
async function syncTable(sheets: any, tableName: string, headers: string[], rows: any[][]) {
  const range = `${tableName}!A1`;

  // Clear existing data
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: `${tableName}!A:Z`,
  });

  // Write headers + data
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: "RAW",
    requestBody: {
      values: [headers, ...rows],
    },
  });
}

// Full sync of all tables
export async function fullSync() {
  const sheets = getSheetsClient();
  if (!sheets || !SPREADSHEET_ID) {
    lastSyncError = "Google Sheets not configured";
    return;
  }

  try {
    // Sync Partners tab
    const allPartners = await db.select().from(partners);
    const programs = await db.select().from(referralPrograms);
    const programMap = new Map(programs.map(p => [p.id, p]));

    await syncTable(sheets, "Partners",
      ["ID", "Company", "Contact", "Email", "Phone", "Status", "Referral Code", "Program", "Payment Method", "Created"],
      allPartners.map(p => [
        p.id, p.companyName, p.contactName, p.email, p.phone, p.status,
        p.referralCode, programMap.get(p.programId)?.name || "", p.paymentMethod,
        p.createdAt?.toISOString() || "",
      ])
    );

    // Sync Leads tab
    const allLeads = await db.select().from(leads);
    const partnerMap = new Map(allPartners.map(p => [p.id, p]));

    await syncTable(sheets, "Leads",
      ["ID", "Contact Name", "Email", "Phone", "Source", "Status", "Partner", "Converted At", "Created"],
      allLeads.map(l => [
        l.id, l.contactName, l.email, l.phone, l.source, l.status,
        partnerMap.get(l.partnerId)?.companyName || "", l.convertedAt?.toISOString() || "",
        l.createdAt?.toISOString() || "",
      ])
    );

    // Sync Commissions tab
    const allCommissions = await db.select().from(commissions);

    await syncTable(sheets, "Commissions",
      ["ID", "Partner", "Lead", "Amount ($)", "Status", "Retention Days", "Eligible At", "Paid At", "Quarter", "Created"],
      allCommissions.map(c => [
        c.id, partnerMap.get(c.partnerId)?.companyName || "", c.leadId,
        (c.amount / 100).toFixed(2), c.status, c.retentionDays,
        c.eligibleAt?.toISOString() || "", c.paidAt?.toISOString() || "",
        c.payoutQuarter || "", c.createdAt?.toISOString() || "",
      ])
    );

    lastSyncTime = new Date();
    lastSyncError = null;
    dirtyTables.clear();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    lastSyncError = message;
    console.error("Google Sheets sync error:", message);
  }
}

// Batched sync - only sync dirty tables
async function batchedSync() {
  if (dirtyTables.size === 0) return;

  // For simplicity, do a full sync when any table is dirty
  // This stays well under rate limits with 60-second intervals
  await fullSync();
}

// Start the sync interval (60 seconds)
export function startSyncInterval() {
  if (!SPREADSHEET_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    console.log("Google Sheets sync not configured (missing env vars)");
    return;
  }

  setInterval(batchedSync, 60 * 1000);
  console.log("Google Sheets sync interval started (every 60s)");
}

// Get sync status for admin UI
export function getSyncStatus() {
  return {
    configured: !!(SPREADSHEET_ID && process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
    lastSyncTime: lastSyncTime?.toISOString() || null,
    lastSyncError,
    pendingTables: Array.from(dirtyTables),
  };
}
