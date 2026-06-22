function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type EmailLayoutInput = {
  title: string;
  greeting: string;
  body: string;
  buttonLabel: string;
  buttonUrl: string;
  footnote?: string;
};

export function buildEmailLayout(input: EmailLayoutInput) {
  const footnote =
    input.footnote ??
    "If you did not request this, you can safely ignore this email.";

  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,-apple-system,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06)">
          <tr>
            <td style="background:linear-gradient(135deg,#FFCC00,#FFB800);padding:24px 28px">
              <p style="margin:0;font-size:20px;font-weight:700;color:#1a1a1a">BundleHub</p>
              <p style="margin:4px 0 0;font-size:12px;color:#1a1a1a99">Ghana digital marketplace</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px">
              <h1 style="margin:0 0 12px;font-size:20px;color:#1a1a1a">${escapeHtml(input.title)}</h1>
              <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#444">Hi ${escapeHtml(input.greeting)},</p>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#444">${input.body}</p>
              <a href="${input.buttonUrl}" style="display:inline-block;background:#FFCC00;color:#1a1a1a;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:600;font-size:14px">
                ${escapeHtml(input.buttonLabel)}
              </a>
              <p style="margin:28px 0 0;font-size:12px;line-height:1.5;color:#888">${escapeHtml(footnote)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px;background:#fafafa;border-top:1px solid #eee">
              <p style="margin:0;font-size:11px;color:#aaa">© BundleHub Ghana</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  const text = `${input.title}\n\nHi ${input.greeting},\n\n${input.body.replace(/<[^>]+>/g, "")}\n\n${input.buttonLabel}: ${input.buttonUrl}\n\n${footnote}\n\n— BundleHub`;

  return { html, text };
}

export function passwordResetEmail(name: string, resetUrl: string) {
  const { html, text } = buildEmailLayout({
    title: "Reset your password",
    greeting: name,
    body: "We received a request to reset your BundleHub password. Click the button below — this link expires in <strong>1 hour</strong>.",
    buttonLabel: "Reset password",
    buttonUrl: resetUrl
  });
  return { subject: "Reset your BundleHub password", html, text };
}

export function emailVerificationEmail(name: string, verifyUrl: string) {
  const { html, text } = buildEmailLayout({
    title: "Verify your email",
    greeting: name,
    body: "Welcome to BundleHub! Please confirm your email address to activate your account. This link expires in <strong>24 hours</strong>.",
    buttonLabel: "Verify email",
    buttonUrl: verifyUrl,
    footnote: "If you did not create a BundleHub account, ignore this email."
  });
  return { subject: "Verify your BundleHub email", html, text };
}

export function welcomeEmail(name: string, loginUrl: string) {
  const { html, text } = buildEmailLayout({
    title: "You're all set!",
    greeting: name,
    body: "Your email is verified and your BundleHub account is active. Sign in to browse shops, buy bundles, or manage your dashboard.",
    buttonLabel: "Sign in to BundleHub",
    buttonUrl: loginUrl,
    footnote: "Thank you for joining BundleHub Ghana."
  });
  return { subject: "Welcome to BundleHub", html, text };
}
