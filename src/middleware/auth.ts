import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import type { JobClaims } from "../types";

export interface AuthedRequest extends Request {
  auth?: JobClaims;
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const header = req.header("authorization");
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "missing_bearer_token" });
    return;
  }
  const token = header.slice("Bearer ".length).trim();
  try {
    const claims = jwt.verify(token, config.jwtSecret, { algorithms: ["HS256"] }) as JobClaims;
    req.auth = claims;
    next();
  } catch {
    res.status(401).json({ error: "invalid_token" });
  }
}
