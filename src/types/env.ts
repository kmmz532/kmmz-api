import type { EmailSender } from "../services/email";

export type Env = {
  Bindings: {
    DISCORD_WEBHOOK_URL: string;
    CONTACT_FROM_ADDRESS: string;
    // 自動返信のプロバイダ: "cloudflare"(既定)または "resend"
    EMAIL_PROVIDER?: string;
    // Cloudflare Email Service(send_email バインディング)
    EMAIL?: EmailSender;
    // Resend を使う場合のAPIキー(シークレット)
    RESEND_API_KEY?: string;
    // Resend の差出人(検証済み: noreply@notify.kmmz.jp)
    RESEND_FROM_ADDRESS?: string;
    // 管理者宛先: 常に受信(例: contact@kmmz.jp)
    ADMIN_EMAIL?: string;
    // 管理者宛先: スパム以外のみ受信(例: me@kmmz.jp)
    ADMIN_EMAIL_STRICT?: string;
    // Turnstile の Secret Key(シークレット)
    TURNSTILE_SECRET_KEY: string;
  };
};
