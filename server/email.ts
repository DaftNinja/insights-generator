import { Resend } from "resend";

// Sender — override with RESEND_FROM env var if a custom domain is configured.
const FROM = process.env.RESEND_FROM ?? "Maudslay Consulting <contact@1giglabs.com>";
const APP_URL = process.env.APP_URL ?? "https://mc.1giglabs.com";

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("⚠️  RESEND_API_KEY not set — emails will be logged only");
    return {
      emails: {
        send: async (opts: any) => {
          console.log(`[Email mock] To: ${opts.to} | Subject: ${opts.subject}`);
          return { data: { id: "mock" }, error: null };
        },
      },
    } as any;
  }
  return new Resend(key);
}

async function send(opts: { to: string; subject: string; html: string }): Promise<void> {
  console.log(`📧 Sending email to ${opts.to}: ${opts.subject}`);
  try {
    const { data, error } = await getResend().emails.send({ from: FROM, ...opts });
    if (error) {
      console.error(`❌ Email send error to ${opts.to}:`, error);
      throw new Error(`Email failed: ${JSON.stringify(error)}`);
    }
    console.log(`✅ Email sent to ${opts.to} (id: ${(data as any)?.id})`);
  } catch (err) {
    console.error(`❌ Email exception to ${opts.to}:`, err);
    throw err;
  }
}

// ─── Magic link sign-in ───────────────────────────────────────────────────────

export async function sendMagicLinkEmail(
  email: string,
  firstName: string,
  token: string
): Promise<void> {
  const link = `${APP_URL}/api/auth/callback?token=${token}`;
  console.log(`🔗 Magic link: ${link}`);

  await send({
    to: email,
    subject: "Your Maudslay Consulting sign-in link",
    html: `
      <div style="font-family: Inter, -apple-system, Segoe UI, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #F5F4F1;">
        <div style="background: white; border-radius: 2px; padding: 40px 32px; border: 1px solid #DDD9D2; border-top: 3px solid #1C2B5C;">

          <!-- Logo mark -->
          <div style="margin-bottom: 28px;">
            <div style="display: inline-block; width: 44px; height: 44px; background: #1C2B5C; border-radius: 4px; text-align: center; line-height: 1; padding-top: 10px; margin-bottom: 14px;">
              <span style="color: white; font-family: Georgia, serif; font-weight: 700; font-size: 18px;">M</span><span style="color: #A0A8C4; font-family: Georgia, serif; font-size: 11px;">C</span>
            </div>
            <div>
              <div style="font-family: Georgia, serif; font-size: 13px; font-weight: 600; letter-spacing: 0.18em; color: #1C2B5C; text-transform: uppercase;">Maudslay</div>
              <div style="font-family: Inter, sans-serif; font-size: 9px; letter-spacing: 0.25em; color: #8A8D9A; text-transform: uppercase;">Consulting</div>
            </div>
          </div>

          <h1 style="margin: 0 0 16px; font-family: Georgia, serif; font-size: 22px; font-weight: 600; color: #1A1F35; letter-spacing: -0.01em;">
            Sign in to your account
          </h1>
          <p style="color: #4C5169; font-size: 15px; line-height: 1.65; margin: 0 0 28px;">
            Hi ${firstName}, click the button below to sign in to your <strong style="color: #1A1F35;">Maudslay Consulting Intelligence Platform</strong> account. This link can only be used once and expires in 15 minutes.
          </p>

          <a href="${link}" style="display: inline-block; background: #1C2B5C; color: white; text-decoration: none; font-family: Inter, sans-serif; font-weight: 500; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; padding: 13px 28px; border-radius: 2px; margin-bottom: 28px;">
            Sign in
          </a>

          <hr style="border: none; border-top: 1px solid #DDD9D2; margin: 0 0 20px;" />

          <p style="color: #8A8D9A; font-size: 13px; margin: 0 0 8px; line-height: 1.5;">
            If you didn't request this, you can safely ignore this email.
          </p>
          <p style="color: #CBC6BE; font-size: 11px; margin: 0; word-break: break-all;">
            Or paste this URL into your browser: <span style="color: #1C2B5C;">${link}</span>
          </p>
        </div>
        <p style="text-align: center; color: #8A8D9A; font-size: 11px; letter-spacing: 0.08em; margin-top: 20px; text-transform: uppercase;">
          Maudslay Consulting · Intelligence Platform
        </p>
      </div>
    `,
  });
}

// ─── Credit limit notification ────────────────────────────────────────────────

export async function sendCreditLimitEmail(email: string, firstName: string): Promise<void> {
  await send({
    to: email,
    subject: "You've used all your Maudslay Consulting report credits",
    html: `
      <div style="font-family: Inter, -apple-system, Segoe UI, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #F5F4F1;">
        <div style="background: white; border-radius: 2px; padding: 40px 32px; border: 1px solid #DDD9D2; border-top: 3px solid #1C2B5C;">
          <h1 style="margin: 0 0 16px; font-family: Georgia, serif; font-size: 22px; font-weight: 600; color: #1A1F35;">Report credits used</h1>
          <p style="color: #4C5169; font-size: 15px; line-height: 1.65; margin: 0 0 16px;">
            Hi ${firstName}, you've used all 5 of your free report credits.
          </p>
          <p style="color: #4C5169; font-size: 15px; line-height: 1.65; margin: 0 0 16px;">
            To continue generating reports, please contact your Maudslay Consulting account manager to request additional credits.
          </p>
          <p style="color: #8A8D9A; font-size: 13px;">Cached reports don't use credits.</p>
        </div>
        <p style="text-align: center; color: #8A8D9A; font-size: 11px; letter-spacing: 0.08em; margin-top: 20px; text-transform: uppercase;">
          Maudslay Consulting · Intelligence Platform
        </p>
      </div>
    `,
  });
}
