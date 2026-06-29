const ADMIN_EMAILS = new Set(["ngfilho@gmail.com", "egeohub101@gmail.com"]);

export function isAdminEmail(email: string | null | undefined) {
  return email ? ADMIN_EMAILS.has(email.toLowerCase()) : false;
}

export type AppUser = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  isAdmin: boolean;
};

export function withAdminFlag<T extends { email: string }>(user: T | null) {
  if (!user) {
    return null;
  }

  return {
    ...user,
    isAdmin: isAdminEmail(user.email),
  };
}
