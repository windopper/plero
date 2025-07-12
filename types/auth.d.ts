import type { User as AuthUser } from "#auth-utils";

declare module '#auth-utils' {
    interface User extends AuthUser {
        id: string;
        name: string;
        email: string;
        avatar: string;
        provider: string;
        role: string;
        isActive: boolean;
        createdAt: number;
        updatedAt: number;
        loginCount: number;
        preferences: {
            theme: string;
            language: string;
            notifications: boolean;
            emailNotifications: boolean;
        };
        metadata: Record<string, any>;
    }
}

export {}