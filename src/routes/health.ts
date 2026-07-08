import { Hono } from "hono";
import type { Env } from "../types/env";

export const healthRoute = new Hono<Env>();

healthRoute.get("/", (c) => c.json({ status: "ok" }));
