import jwt from "jsonwebtoken";
import request from "supertest";
import { createApp } from "../src/app";
import { config } from "../src/config";
import { signEnvelope, verifyEnvelope } from "../src/envelope";

describe("envelope verify (robust)", () => {
  it("round-trips a signed job envelope", () => {
    const token = signEnvelope({ sub: "worker", jobId: "job-1", channel: "email" });
    const claims = verifyEnvelope(token);
    expect(claims.jobId).toBe("job-1");
    expect(claims.channel).toBe("email");
  });

  it("rejects expired envelopes", () => {
    const token = signEnvelope({ sub: "worker", jobId: "job-2", channel: "sms" }, -10);
    expect(() => verifyEnvelope(token)).toThrow(/jwt expired/);
  });

  it("rejects wrong-secret envelopes", () => {
    const token = jwt.sign({ sub: "worker", jobId: "job-3", channel: "push" }, "other", { algorithm: "HS256" });
    expect(() => verifyEnvelope(token)).toThrow();
  });

  it("rejects missing segments", () => {
    expect(() => verifyEnvelope("a.b")).toThrow();
  });

  it("rejects empty token", () => {
    expect(() => verifyEnvelope("")).toThrow();
  });

  it("POST /jobs/deliver accepts a valid bearer", async () => {
    const app = createApp();
    const token = signEnvelope({ sub: "worker", jobId: "job-9", channel: "email" });
    const res = await request(app)
      .post("/jobs/deliver")
      .set("Authorization", `Bearer ${token}`)
      .send({ jobId: "job-9", channel: "email", recipient: "a@b.co", body: "hi" });
    expect(res.status).toBe(202);
  });

  it("POST /jobs/deliver rejects jobId mismatch", async () => {
    const app = createApp();
    const token = signEnvelope({ sub: "worker", jobId: "job-a", channel: "email" });
    const res = await request(app)
      .post("/jobs/deliver")
      .set("Authorization", `Bearer ${token}`)
      .send({ jobId: "job-b", channel: "email", recipient: "a@b.co", body: "hi" });
    expect(res.status).toBe(403);
  });

  it("GET /health is open", async () => {
    const app = createApp();
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.service).toBe("notifications-service");
  });

  it("verify-envelope endpoint reports valid claims", async () => {
    const app = createApp();
    const token = signEnvelope({ sub: "worker", jobId: "job-v", channel: "push" });
    const res = await request(app).post("/jobs/verify-envelope").send({ token });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.claims.jobId).toBe("job-v");
  });

  // PLANTED (notifications): pins error message for invalid secret shapes; v9 wording differs from 8.x.
  it("surfaces a clear error when verify is given a non-string secret shape", () => {
    const token = signEnvelope({ sub: "worker", jobId: "job-plant", channel: "email" });
    expect(() => jwt.verify(token, { key: config.jwtSecret } as never)).toThrow(
      /secretOrPublicKey is not valid key material/,
    );
  });
});
