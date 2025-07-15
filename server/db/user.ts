import { eq, count } from 'drizzle-orm';
import { db } from '.';
import { USER_SCHEMA } from './schema';
import type { User } from './schema';
import type { DbResult } from '../type';

// 기본 사용자 CRUD
export async function getUser(id: string): Promise<DbResult<User>> {
    try {
        const result = await db
            .select()
            .from(USER_SCHEMA)
            .where(eq(USER_SCHEMA.id, id))
            .limit(1);

        if (result.length > 0) {
            return { success: true, data: result[0] };
        } else {
            return { success: false, error: { message: "User not found" } };
        }
    } catch (error) {
        return { success: false, error: { message: `Failed to get user: ${error}` } };
    }
}

export async function setUser(data: Omit<User, 'id'>): Promise<DbResult<User>> {
    try {
        
        const result = await db
            .insert(USER_SCHEMA)
            .values(data)
            .onConflictDoUpdate({
                target: USER_SCHEMA.id,
                set: {
                    name: data.name,
                    email: data.email,
                    avatar: data.avatar,
                    displayName: data.displayName,
                    bio: data.bio,
                    role: data.role,
                    isActive: data.isActive,
                    lastLoginAt: data.lastLoginAt,
                    loginCount: data.loginCount,
                    preferences: data.preferences,
                    metadata: data.metadata,
                    updatedAt: new Date(),
                }
            })
            .returning();

        return { success: true, data: result[0] };
    } catch (error) {
        return { success: false, error: { message: `Failed to set user: ${error}` } };
    }
}

export async function createOrUpdateUserFromGoogle(data: Omit<User, 'id'>): Promise<DbResult<User>> {
    const user = await getUserByEmail(data.email);
    if (user.success) {
        return updateUser(user.data.id, data);
    } else {
        return createUser(data);
    }
}

export async function createUser(data: Omit<User, 'id'>): Promise<DbResult<User>> {
    try {
        const result = await db
            .insert(USER_SCHEMA)
            .values(data)
            .returning();

        return { success: true, data: result[0] };
    } catch (error) {
        return { success: false, error: { message: `Failed to create user: ${error}` } };
    }
}

export async function updateUser(id: string, data: Partial<Omit<User, 'id'>>): Promise<DbResult<User>> {
    try {
        const result = await db
            .update(USER_SCHEMA)
            .set(data)
            .where(eq(USER_SCHEMA.id, id))
            .returning();

        if (result.length > 0) {
            return { success: true, data: result[0] };
        } else {
            return { success: false, error: { message: "User not found" } };
        }
    } catch (error) {
        return { success: false, error: { message: `Failed to update user: ${error}` } };
    }
}

export async function deleteUser(id: string): Promise<DbResult<void>> {
    try {
        await db
            .delete(USER_SCHEMA)
            .where(eq(USER_SCHEMA.id, id));

        return { success: true, data: undefined };
    } catch (error) {
        return { success: false, error: { message: `Failed to delete user: ${error}` } };
    }
}

// 이메일로 사용자 조회
export async function getUserByEmail(email: string): Promise<DbResult<User>> {
    try {
        const result = await db
            .select()
            .from(USER_SCHEMA)
            .where(eq(USER_SCHEMA.email, email))
            .limit(1);

        if (result.length > 0) {
            return { success: true, data: result[0] };
        } else {
            return { success: false, error: { message: "User not found" } };
        }
    } catch (error) {
        return { success: false, error: { message: `Failed to get user by email: ${error}` } };
    }
}

// 이메일 중복 확인
export async function checkEmailExists(email: string, excludeId?: string): Promise<DbResult<boolean>> {
    try {
        const result = await db
            .select()
            .from(USER_SCHEMA)
            .where(eq(USER_SCHEMA.email, email))
            .limit(1);

        const exists = result.length > 0;
        return { success: true, data: exists };
    } catch (error) {
        return { success: false, error: { message: `Failed to check email existence: ${error}` } };
    }
}

// 사용자 로그인 정보 업데이트
export async function updateUserLogin(id: string): Promise<DbResult<User>> {
    try {
        // 현재 사용자 정보 조회
        const currentUser = await getUser(id);
        if (!currentUser.success) {
            return currentUser;
        }

        const result = await db
            .update(USER_SCHEMA)
            .set({
                lastLoginAt: new Date(),
                loginCount: currentUser.data.loginCount + 1,
                updatedAt: new Date(),
            })
            .where(eq(USER_SCHEMA.id, id))
            .returning();

        if (result.length > 0) {
            return { success: true, data: result[0] };
        } else {
            return { success: false, error: { message: "User not found" } };
        }
    } catch (error) {
        return { success: false, error: { message: `Failed to update user login: ${error}` } };
    }
}

// 사용자 선호도 업데이트
export async function updateUserPreferences(id: string, preferences: any): Promise<DbResult<User>> {
    try {
        const result = await db
            .update(USER_SCHEMA)
            .set({
                preferences,
                updatedAt: new Date(),
            })
            .where(eq(USER_SCHEMA.id, id))
            .returning();

        if (result.length > 0) {
            return { success: true, data: result[0] };
        } else {
            return { success: false, error: { message: "User not found" } };
        }
    } catch (error) {
        return { success: false, error: { message: `Failed to update user preferences: ${error}` } };
    }
}

// 활성 사용자 목록 조회 (관리자용)
export async function getActiveUsers(): Promise<DbResult<User[]>> {
    try {
        const result = await db
            .select()
            .from(USER_SCHEMA)
            .where(eq(USER_SCHEMA.isActive, true));

        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: { message: `Failed to get active users: ${error}` } };
    }
}

// 사용자 계정 비활성화
export async function deactivateUser(id: string): Promise<DbResult<User>> {
    try {
        const result = await db
            .update(USER_SCHEMA)
            .set({
                isActive: false,
                updatedAt: new Date(),
            })
            .where(eq(USER_SCHEMA.id, id))
            .returning();

        if (result.length > 0) {
            return { success: true, data: result[0] };
        } else {
            return { success: false, error: { message: "User not found" } };
        }
    } catch (error) {
        return { success: false, error: { message: `Failed to deactivate user: ${error}` } };
    }
}

// 사용자 계정 활성화
export async function activateUser(id: string): Promise<DbResult<User>> {
    try {
        const result = await db
            .update(USER_SCHEMA)
            .set({
                isActive: true,
                updatedAt: new Date(),
            })
            .where(eq(USER_SCHEMA.id, id))
            .returning();

        if (result.length > 0) {
            return { success: true, data: result[0] };
        } else {
            return { success: false, error: { message: "User not found" } };
        }
    } catch (error) {
        return { success: false, error: { message: `Failed to activate user: ${error}` } };
    }
} 