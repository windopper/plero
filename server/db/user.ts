import { 
    GetItemCommand, 
    PutItemCommand, 
    DeleteItemCommand, 
    ScanCommand, 
    QueryCommand,
    UpdateItemCommand
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import client from ".";
import { USER_COLLECTION } from "./constants";
import { User, USER_SCHEMA } from "./schema";
import { v4 as uuidv4 } from 'uuid';
import type { DbResult } from '../type';

// 기본 사용자 CRUD
export async function getUser(id: string): Promise<DbResult<User>> {
    try {
        const command = new GetItemCommand({
            TableName: USER_COLLECTION,
            Key: marshall({ id }),
        });

        const response = await client.send(command);
        
        if (response.Item) {
            const data = unmarshall(response.Item);
            const result = USER_SCHEMA.safeParse(data);
            if (result.success) {
                return { success: true, data: result.data };
            } else {
                return { success: false, error: { message: "Invalid user data format" } };
            }
        } else {
            return { success: false, error: { message: "User not found" } };
        }
    } catch (error) {
        return { success: false, error: { message: `Failed to get user: ${error}` } };
    }
}

export async function setUser(id: string, data: Omit<User, 'id'>): Promise<DbResult<User>> {
    try {
        const parseResult = USER_SCHEMA.safeParse({ id, ...data });
        
        if (!parseResult.success) {
            return { success: false, error: { message: "Invalid user data" } };
        }
        
        const command = new PutItemCommand({
            TableName: USER_COLLECTION,
            Item: marshall(parseResult.data),
        });

        await client.send(command);
        return { success: true, data: parseResult.data };
    } catch (error) {
        return { success: false, error: { message: `Failed to set user: ${error}` } };
    }
}

export async function updateUser(id: string, data: Partial<Omit<User, 'id'>>): Promise<DbResult<User>> {
    try {
        // 현재 사용자 데이터 가져오기
        const currentUser = await getUser(id);
        if (!currentUser.success) {
            return currentUser;
        }
        
        // 병합된 데이터 검증
        const mergedData = { ...currentUser.data, ...data, updatedAt: Date.now() };
        const parseResult = USER_SCHEMA.safeParse(mergedData);
        
        if (!parseResult.success) {
            return { success: false, error: { message: "Invalid updated user data" } };
        }
        
        const command = new PutItemCommand({
            TableName: USER_COLLECTION,
            Item: marshall(parseResult.data),
        });

        await client.send(command);
        return { success: true, data: parseResult.data };
    } catch (error) {
        return { success: false, error: { message: `Failed to update user: ${error}` } };
    }
}

export async function deleteUser(id: string): Promise<DbResult<void>> {
    try {
        const command = new DeleteItemCommand({
            TableName: USER_COLLECTION,
            Key: marshall({ id }),
        });

        await client.send(command);
        return { success: true, data: undefined };
    } catch (error) {
        return { success: false, error: { message: `Failed to delete user: ${error}` } };
    }
}

export async function getUserByEmail(email: string): Promise<DbResult<User>> {
    try {
        const command = new ScanCommand({
            TableName: USER_COLLECTION,
            FilterExpression: "email = :email",
            ExpressionAttributeValues: marshall({
                ":email": email
            }),
        });

        const response = await client.send(command);
        
        if (response.Items && response.Items.length > 0) {
            const data = unmarshall(response.Items[0]);
            const result = USER_SCHEMA.safeParse(data);
            if (result.success) {
                return { success: true, data: result.data };
            } else {
                return { success: false, error: { message: "Invalid user data format" } };
            }
        } else {
            return { success: false, error: { message: "User not found with email" } };
        }
    } catch (error) {
        return { success: false, error: { message: `Failed to get user by email: ${error}` } };
    }
}

// Google OAuth 로그인 시 사용자 생성 또는 업데이트
export async function createOrUpdateUserFromGoogle(googleUserData: {
    email: string;
    name: string;
    picture?: string;
}): Promise<DbResult<User>> {
    try {
        // 먼저 기존 사용자 확인
        const existingUser = await getUserByEmail(googleUserData.email);
        
        const now = Date.now();
        
        if (existingUser.success) {
            // 기존 사용자 - 로그인 정보 업데이트
            const updateData: Partial<Omit<User, 'id'>> = {
                lastLoginAt: now,
                loginCount: existingUser.data.loginCount + 1,
                updatedAt: now,
                // Google에서 받은 최신 정보로 업데이트
                name: googleUserData.name,
                avatar: googleUserData.picture,
            };
            
            return await updateUser(existingUser.data.id, updateData);
        } else {
            // 신규 사용자 생성
            const newUserId = uuidv4();
            const newUserData: Omit<User, 'id'> = {
                provider: "google",
                email: googleUserData.email,
                name: googleUserData.name,
                avatar: googleUserData.picture,
                role: "editor",
                isActive: true,
                createdAt: now,
                updatedAt: now,
                lastLoginAt: now,
                loginCount: 1,
                preferences: {
                    theme: "auto",
                    language: "ko",
                    notifications: true,
                    emailNotifications: false,
                },
            };
            
            return await setUser(newUserId, newUserData);
        }
    } catch (error) {
        return { success: false, error: { message: `Failed to create or update user from Google: ${error}` } };
    }
}

// 사용자 권한 확인
export async function hasPermission(userId: string, requiredRole: User['role']): Promise<boolean> {
    const user = await getUser(userId);
    if (!user.success) return false;
    
    const roleHierarchy: Record<User['role'], number> = { viewer: 1, editor: 2, admin: 3 };
    const userRoleLevel = roleHierarchy[user.data.role];
    const requiredRoleLevel = roleHierarchy[requiredRole];
    
    return userRoleLevel >= requiredRoleLevel;
}

// 활성 사용자 확인
export async function isActiveUser(userId: string): Promise<boolean> {
    const user = await getUser(userId);
    return user.success && user.data.isActive === true;
}

// 사용자 비활성화 (소프트 삭제)
export async function deactivateUser(userId: string): Promise<DbResult<User>> {
    return await updateUser(userId, { 
        isActive: false, 
        updatedAt: Date.now() 
    });
}

// 사용자 활성화
export async function activateUser(userId: string): Promise<DbResult<User>> {
    return await updateUser(userId, { 
        isActive: true, 
        updatedAt: Date.now() 
    });
} 