import crypto from "crypto";

export function generatePortalToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function getTokenExpiry(days = 7): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + days);
  return expiry;
}
