export const ADMIN_EMAIL = "nightmareasian@gmail.com";

export function isAdminEmail(email: string | null | undefined) {
  return Boolean(email && email.trim().toLowerCase() === ADMIN_EMAIL);
}
