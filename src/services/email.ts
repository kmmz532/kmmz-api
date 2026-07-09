import type { ContactInput } from "../validators/contact";
import { sendViaResend } from "./resend";
import { checkSpam } from "./spam";

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

// メール送信に必要な環境変数・バインディング。
export interface MailEnv {
  // Cloudflare Email Service の差出人(検証済み: noreply@kmmz.jp)
  CONTACT_FROM_ADDRESS: string;
  // "cloudflare"(既定)または "resend"。未指定なら RESEND_API_KEY の有無で自動判定。
  EMAIL_PROVIDER?: string;
  EMAIL?: EmailSender; // Cloudflare Email Service
  RESEND_API_KEY?: string; // Resend
  RESEND_FROM_ADDRESS?: string; // Resend の差出人(検証済み: noreply@notify.kmmz.jp)
  // 管理者宛先
  ADMIN_EMAIL?: string; // 常に受信(例: contact@kmmz.jp)
  ADMIN_EMAIL_STRICT?: string; // スパム以外のみ受信(例: me@kmmz.jp)
}

type Mail = { from: string; to: string; subject: string; text: string };

function resolveProvider(env: MailEnv): "cloudflare" | "resend" {
  const p = env.EMAIL_PROVIDER ?? (env.RESEND_API_KEY ? "resend" : "cloudflare");
  return p === "resend" ? "resend" : "cloudflare";
}

function resolveFrom(env: MailEnv): string {
  return resolveProvider(env) === "resend"
    ? env.RESEND_FROM_ADDRESS ?? env.CONTACT_FROM_ADDRESS
    : env.CONTACT_FROM_ADDRESS;
}

async function dispatch(env: MailEnv, mail: Mail): Promise<void> {
  if (resolveProvider(env) === "resend") {
    if (!env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set");
    }
    await sendViaResend(env.RESEND_API_KEY, mail);
    return;
  }
  if (!env.EMAIL) {
    throw new Error("EMAIL binding is not configured");
  }
  await env.EMAIL.send(mail);
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

function buildAdminNotice(
  data: ContactInput,
  reasons: string[]
): { subject: string; text: string } {
  const flag = reasons.length > 0 ? "[スパム疑い] " : "";
  return {
    subject: `${flag}お問い合わせ: ${data.name} 様`,
    text: [
      "お問い合わせを受信しました。",
      "",
      `名前: ${data.name}`,
      `メール: ${data.email}`,
      "",
      "内容:",
      data.message,
      ...(reasons.length > 0
        ? ["", `※スパム判定理由: ${reasons.join(", ")}`]
        : []),
    ].join("\n"),
  };
}

// 問い合わせに紐づくメールをまとめて送る。
// - 管理者(ADMIN_EMAIL)には常に通知(スパムはフラグ付き)
// - 厳格宛先(ADMIN_EMAIL_STRICT / メインメール)はスパム以外のみ
// - 問い合わせ者への自動返信はスパム以外のみ(backscatter 防止)
// 個々の失敗は握りつぶし、best-effort で送る。
export async function sendContactMails(
  env: MailEnv,
  data: ContactInput
): Promise<void> {
  const from = resolveFrom(env);
  const { spam, reasons } = checkSpam(data);
  const notice = buildAdminNotice(data, reasons);

  const mails: Mail[] = [];

  if (env.ADMIN_EMAIL) {
    mails.push({ from, to: env.ADMIN_EMAIL, ...notice });
  }
  if (env.ADMIN_EMAIL_STRICT && !spam) {
    mails.push({ from, to: env.ADMIN_EMAIL_STRICT, ...notice });
  }
  if (!spam) {
    mails.push({ from, to: data.email, ...buildAutoReply(data) });
  }

  await Promise.allSettled(mails.map((m) => dispatch(env, m)));
}
