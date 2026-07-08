import type { ContactInput } from "../validators/contact";

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

export async function sendAutoReply(
  email: EmailSender,
  from: string,
  data: ContactInput
): Promise<void> {
  await email.send({
    from,
    to: data.email,
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
  });
}
