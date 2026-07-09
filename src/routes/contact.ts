import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { contactRequestSchema } from "../validators/contact";
import { verifyTurnstile } from "../services/turnstile";
import { notifyDiscord } from "../services/discord";
import { sendContactMails } from "../services/email";
import type { Env } from "../types/env";

export const contactRoute = new Hono<Env>();

contactRoute.post("/", zValidator("json", contactRequestSchema), async (c) => {
  const { token, ...data } = c.req.valid("json");

  // ボット対策: Turnstile を先に検証する
  const ip = c.req.header("CF-Connecting-IP");
  const passed = await verifyTurnstile(c.env.TURNSTILE_SECRET_KEY, token, ip);
  if (!passed) {
    return c.json({ success: false, error: "captcha_failed" }, 403);
  }

  try {
    await notifyDiscord(c.env.DISCORD_WEBHOOK_URL, data);
  } catch {
    return c.json({ success: false, error: "notification_failed" }, 502);
  }

  // メール送信は失敗しても問い合わせ自体は成功扱いにする
  c.executionCtx.waitUntil(sendContactMails(c.env, data).catch(() => {}));

  return c.json({ success: true });
});
