/**
 * Create an admin account for production use.
 * Usage: npx tsx server/scripts/create-admin.ts --username admin --password YourSecurePassword
 */

import { storage } from "../storage";
import { hashPassword } from "../auth";

async function main() {
  const args = process.argv.slice(2);
  const usernameIdx = args.indexOf("--username");
  const passwordIdx = args.indexOf("--password");

  if (usernameIdx === -1 || passwordIdx === -1) {
    console.error("Usage: npx tsx server/scripts/create-admin.ts --username <username> --password <password>");
    process.exit(1);
  }

  const username = args[usernameIdx + 1];
  const password = args[passwordIdx + 1];

  if (!username || !password) {
    console.error("Both --username and --password are required");
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("Password must be at least 8 characters");
    process.exit(1);
  }

  const existing = await storage.getUserByUsername(username);
  if (existing) {
    console.error(`User "${username}" already exists`);
    process.exit(1);
  }

  const user = await storage.createUser({
    username,
    password: hashPassword(password),
  });
  await storage.updateUser(user.id, { role: "admin" });

  console.log(`Admin account created: ${username} (id: ${user.id})`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to create admin:", err);
  process.exit(1);
});
