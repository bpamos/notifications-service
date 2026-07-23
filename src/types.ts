export interface JobClaims {
  sub: string;
  jobId: string;
  channel: "email" | "sms" | "push";
  iat?: number;
  exp?: number;
}

export interface NotificationJob {
  jobId: string;
  channel: "email" | "sms" | "push";
  recipient: string;
  body: string;
}
