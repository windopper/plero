import type { User } from "~/server/db/schema";

export const getMockUser = ({ id }: { id: string }): User => {
  return {
    id,
    provider: "email",
    email: `${id}@example.com`,
    name: `Test User ${id}`,
    role: "editor",
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    loginCount: 0,
    preferences: {
      theme: "auto",
      language: "ko",
      notifications: true,
      emailNotifications: false,
    },
  };
};