import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = "Better Credit Partners <notifications@bettercreditpartners.com>";

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!resend) {
    console.log(`[email] Skipped (no API key): "${subject}" to ${to}`);
    return;
  }
  try {
    await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
    console.log(`[email] Sent: "${subject}" to ${to}`);
  } catch (error) {
    console.error(`[email] Failed: "${subject}" to ${to}`, error);
  }
}

export async function sendPartnerWelcome(name: string, email: string) {
  await sendEmail(email, "Welcome to Better Credit Partners!", `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #060414; color: #ffffff; padding: 40px;">
      <h1 style="color: #52ceff; margin-bottom: 20px;">Welcome, ${escapeHtml(name)}!</h1>
      <p style="color: #ffffffb3; line-height: 1.6;">Thank you for joining the Better Credit Partners referral program.</p>
      <p style="color: #ffffffb3; line-height: 1.6;">Here's what to do next:</p>
      <ol style="color: #ffffffb3; line-height: 1.8;">
        <li>Sign your partner agreement</li>
        <li>Set up your payment details</li>
        <li>Get your referral link</li>
        <li>Start referring clients!</li>
      </ol>
      <p style="color: #ffffffb3; line-height: 1.6;">You earn <strong style="color: #c0d353;">$50</strong> for every qualified referral.</p>
      <p style="color: #ffffff66; font-size: 12px; margin-top: 30px;">Better Credit Partners | Credit Repair Services</p>
    </div>
  `);
}

export async function sendNewLeadAlert(adminEmail: string, leadName: string, partnerName: string) {
  await sendEmail(adminEmail, `New Lead from ${escapeHtml(partnerName)}: ${escapeHtml(leadName)}`, `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #060414; color: #ffffff; padding: 40px;">
      <h2 style="color: #52ceff;">New Lead Submitted</h2>
      <p style="color: #ffffffb3;"><strong>Lead:</strong> ${escapeHtml(leadName)}</p>
      <p style="color: #ffffffb3;"><strong>Referred by:</strong> ${escapeHtml(partnerName)}</p>
      <p style="color: #ffffffb3;">Log in to the admin portal to review this lead.</p>
    </div>
  `);
}

export async function sendLeadConvertedNotification(partnerEmail: string, partnerName: string, leadName: string) {
  await sendEmail(partnerEmail, `Your referral ${escapeHtml(leadName)} has converted!`, `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #060414; color: #ffffff; padding: 40px;">
      <h2 style="color: #c0d353;">Referral Converted!</h2>
      <p style="color: #ffffffb3;">Great news, ${escapeHtml(partnerName)}! Your referral <strong>${escapeHtml(leadName)}</strong> has been converted.</p>
      <p style="color: #ffffffb3;">A commission of <strong style="color: #c0d353;">$50.00</strong> has been created and is now in the retention period.</p>
      <p style="color: #ffffffb3;">You'll be notified when it becomes eligible for payout.</p>
    </div>
  `);
}

export async function sendPayoutNotification(partnerEmail: string, partnerName: string, amount: number, quarter: string) {
  const formatted = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount / 100);
  await sendEmail(partnerEmail, `Payout Processed: ${formatted} for ${quarter}`, `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #060414; color: #ffffff; padding: 40px;">
      <h2 style="color: #c0d353;">Payout Processed!</h2>
      <p style="color: #ffffffb3;">Hi ${escapeHtml(partnerName)},</p>
      <p style="color: #ffffffb3;">Your payout of <strong style="color: #c0d353;">${formatted}</strong> for <strong>${quarter}</strong> has been processed.</p>
      <p style="color: #ffffffb3;">Payment will be sent to your configured payment method.</p>
    </div>
  `);
}
