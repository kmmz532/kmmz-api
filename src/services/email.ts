import type { ContactInput } from "../validators/contact";
import { sendViaResend } from "./resend";

// Cloudflare Email Service の send_email バインディング。
// @cloudflare/workers-types が新APIに未対応のため自前で定義する。
export interface EmailSender {
  send(message: {
    from: string;
    to: string;
    subject: string;
    text?: string;
    html?: string;
  }): Promise<{ messageId?: string }>;
}

// 自動返信に必要な環境変数・バインディング。
export interface AutoReplyEnv {
  // Cloudflare Email Service の差出人(検証済み: noreply@kmmz.jp)
  CONTACT_FROM_ADDRESS: string;
  // "cloudflare"(既定)または "resend"。未指定なら RESEND_API_KEY の有無で自動判定。
  EMAIL_PROVIDER?: string;
  EMAIL?: EmailSender; // Cloudflare Email Service
  RESEND_API_KEY?: string; // Resend
  // Resend の差出人(検証済みドメイン: noreply@notify.kmmz.jp)。未指定なら CONTACT_FROM_ADDRESS。
  RESEND_FROM_ADDRESS?: string;
}

function buildAutoReply(data: ContactInput): { subject: string; text: string } {
  return {
    subject: "【Kmmz1127】お問い合わせを受け付けました",
    text: [
      `こんにちは、${data.name} 様`,
      "",
      "お問い合わせありがとうございます。以下の内容で受け付けました。",
      "",
      "----------------------------------------",
      data.message,
      "----------------------------------------",
      "",
      "内容を確認の上、改めてご連絡する場合がございます。",
      "よろしくお願いいたします。",
      "",
      "※このメールは自動送信です。",
    ].join("\n"),
  };
}

export async function sendAutoReply(
  env: AutoReplyEnv,
  data: ContactInput
): Promise<void> {
  const { subject, text } = buildAutoReply(data);

  const provider =
    env.EMAIL_PROVIDER ?? (env.RESEND_API_KEY ? "resend" : "cloudflare");

  if (provider === "resend") {
    if (!env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set");
    }
    const from = env.RESEND_FROM_ADDRESS ?? env.CONTACT_FROM_ADDRESS;
    await sendViaResend(env.RESEND_API_KEY, {
      from,
      to: data.email,
      subject,
      text,
    });
    return;
  }

  if (!env.EMAIL) {
    throw new Error("EMAIL binding is not configured");
  }
  await env.EMAIL.send({
    from: env.CONTACT_FROM_ADDRESS,
    to: data.email,
    subject,
    text,
  });
}
