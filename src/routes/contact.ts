import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { contactSchema } from "../validators/contact";
import { notifyDiscord } from "../services/discord";
import { sendAutoReply } from "../services/email";
import type { Env } from "../types/env";

export const contactRoute = new Hono<Env>();

contactRoute.post("/", zValidator("json", contactSchema), async (c) => {
  const data = c.req.valid("json");

  try {
    await notifyDiscord(c.env.DISCORD_WEBHOOK_URL, data);
  } catch {
    return c.json({ success: false, error: "notification_failed" }, 502);
  }

  // 自動返信は失敗しても問い合わせ自体は成功扱いにする
  c.executionCtx.waitUntil(
    sendAutoReply(c.env.EMAIL, c.env.CONTACT_FROM_ADDRESS, data).catch(() => {})
  );

  return c.json({ success: true });
});
