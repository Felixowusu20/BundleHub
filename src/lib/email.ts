import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type SendResult = { ok: true } | { ok: false; error: string };

export { passwordResetEmail, emailVerificationEmail, welcomeEmail } from "@/lib/email-templates";

function getFromAddress(): string {
  return (
    process.env.SMTP_FROM ??
    process.env.EMAIL_FROM ??
    (process.env.SMTP_USER ? `BundleHub <${process.env.SMTP_USER}>` : "BundleHub <noreply@bundlehub.gh>")
  );
}

export function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

function isSecureSmtp(): boolean {
  if (process.env.SMTP_SECURE === "true") return true;
  if (process.env.SMTP_SECURE === "false") return false;
  return Number(process.env.SMTP_PORT ?? "587") === 465;
}

function createSmtpTransport(): Transporter {
  const host = process.env.SMTP_HOST ?? "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT ?? "587");
  const secure = isSecureSmtp();

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

async function sendViaSmtp(input: SendEmailInput): Promise<SendResult> {
  if (!isSmtpConfigured()) {
    return { ok: false, error: "SMTP is not configured." };
  }

  try {
    const transport = createSmtpTransport();
    await transport.sendMail({
      from: getFromAddress(),
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text
    });
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not send email via SMTP.";
    console.error("[email:smtp]", message);
    return { ok: false, error: message };
  }
}

async function sendViaResend(input: SendEmailInput): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "Resend is not configured." };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: getFromAddress(),
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text
      })
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      return { ok: false, error: body.message ?? "Could not send email." };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "Could not send email." };
  }
}

function sendViaDevLog(input: SendEmailInput): SendResult {
  console.info("[email:dev]", input.subject, "→", input.to);
  console.info(input.text);
  return { ok: true };
}

/** Sends mail via Google SMTP (preferred), Resend, or dev console fallback. */
export async function sendEmail(input: SendEmailInput): Promise<SendResult> {
  if (isSmtpConfigured()) {
    return sendViaSmtp(input);
  }

  if (process.env.RESEND_API_KEY) {
    return sendViaResend(input);
  }

  if (process.env.NODE_ENV === "development") {
    return sendViaDevLog(input);
  }

  return { ok: false, error: "Email is not configured. Set SMTP_USER and SMTP_PASS for Gmail." };
}
