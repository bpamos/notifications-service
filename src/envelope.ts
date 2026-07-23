import jwt from "jsonwebtoken";
import { config } from "./config";
import type { JobClaims } from "./types";

export function signEnvelope(claims: Omit<JobClaims, "iat" | "exp">, expiresIn: string | number = "1h"): string {
  return jwt.sign(claims, config.jwtSecret, { algorithm: "HS256", expiresIn });
}

export function verifyEnvelope(token: string): JobClaims {
  return jwt.verify(token, config.jwtSecret, { algorithms: ["HS256"] }) as JobClaims;
}
