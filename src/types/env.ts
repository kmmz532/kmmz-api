import type { EmailSender } from "../services/email";

export type Env = {
  Bindings: {
    DISCORD_WEBHOOK_URL: string;
    CONTACT_FROM_ADDRESS: string;
    EMAIL: EmailSender;
  };
};
