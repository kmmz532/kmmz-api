import { Hono } from "hono";
import { cors } from "hono/cors";
import { contactRoute } from "./routes/contact";
import { healthRoute } from "./routes/health";
import type { Env } from "./types/env";

const app = new Hono<Env>();

app.use(
  "*",
  cors({
    origin: ["https://kmmz.jp", "http://localhost:3000"],
    allowMethods: ["GET", "POST", "OPTIONS"],
  })
);

app.route("/contact", contactRoute);
app.route("/health", healthRoute);

export default app;
