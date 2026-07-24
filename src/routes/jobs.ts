import { Router } from "express";
import { requireAuth, type AuthedRequest } from "../middleware/auth";
import { verifyEnvelope } from "../envelope";
import type { NotificationJob } from "../types";

const delivered: NotificationJob[] = [];

export const jobsRouter = Router();

jobsRouter.get("/health", (_req, res) => {
  res.json({ ok: true, service: "notifications-service" });
});

jobsRouter.post("/jobs/deliver", requireAuth, (req: AuthedRequest, res) => {
  const job = req.body as NotificationJob;
  if (!job?.jobId || !job.channel || !job.recipient || !job.body) {
    res.status(400).json({ error: "invalid_job" });
    return;
  }
  if (req.auth?.jobId !== job.jobId) {
    res.status(403).json({ error: "job_mismatch" });
    return;
  }
  delivered.push(job);
  res.status(202).json({ accepted: true, jobId: job.jobId });
});

jobsRouter.post("/jobs/verify-envelope", (req, res) => {
  const token = String(req.body?.token ?? "");
  try {
    const claims = verifyEnvelope(token);
    res.json({ valid: true, claims });
  } catch {
    res.status(400).json({ valid: false });
  }
});

jobsRouter.get("/jobs/delivered", requireAuth, (_req, res) => {
  res.json({ count: delivered.length, items: delivered });
});
