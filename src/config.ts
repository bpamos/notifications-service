export const config = {
  port: Number(process.env.PORT ?? 3002),
  jwtSecret: process.env.JWT_SECRET ?? "notifications-dev-secret-change-me-32c",
  serviceName: "notifications-service",
};
