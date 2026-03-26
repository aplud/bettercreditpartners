import { db as _db } from "./db";
const db = _db!;
import { users, referralPrograms } from "@shared/schema";
import { hashPassword } from "./auth";

async function seed() {
  console.log("Seeding database...");

  // Create admin user
  const hashedPassword = hashPassword("admin123");
  await db
    .insert(users)
    .values({
      username: "aaron",
      password: hashedPassword,
      role: "admin",
    })
    .onConflictDoNothing({ target: users.username });

  console.log("  Admin user 'aaron' created (or already exists).");

  // Create default referral program
  await db
    .insert(referralPrograms)
    .values({
      name: "Standard $50",
      commissionAmount: 5000,
      retentionDays: 60,
      payoutSchedule: "quarterly",
      isActive: true,
      description:
        "Standard referral program - $50 per converted lead after 60-day retention",
    })
    .onConflictDoNothing();

  console.log("  Default referral program created (or already exists).");

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
