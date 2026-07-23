import express from "express";
import { jobsRouter } from "./routes/jobs";

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use(jobsRouter);
  return app;
}
