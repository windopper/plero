import { getFirestore, doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import app from ".";
import { USER_COLLECTION } from "./constants";
import { User, USER_SCHEMA } from "./schema";
import { v4 as uuidv4 } from 'uuid';

// 일관성 있는 반환 타입 정의
type DbResult<T> = {
    success: true;
    data: T;
} | {
    success: false;
    error: { message: string };
};

// 기본 사용자 CRUD
export async function getUser(id: string): Promise<DbResult<User>> {
    const db = getFirestore(app);
    const docRef = doc(db, USER_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
        const result = USER_SCHEMA.safeParse({ id, ...docSnap.data() });
        if (result.success) {
            return { success: true, data: result.data };
        } else {
            return { success: false, error: { message: "Invalid user data format" } };
        }
    } else {
        return { success: false, error: { message: "User not found" } };
    }
}

export async function setUser(id: string, data: Omit<User, 'id'>): Promise<DbResult<User>> {
    const db = getFirestore(app);
    const docRef = doc(db, USER_COLLECTION, id);
    const parseResult = USER_SCHEMA.safeParse({ id, ...data });
    
    if (!parseResult.success) {
        return { success: false, error: { message: "Invalid user data" } };
    }
    
    const { id: userId, ...userData } = parseResult.data;
    await setDoc(docRef, userData);
    return { success: true, data: parseResult.data };
}

export async function updateUser(id: string, data: Partial<Omit<User, 'id'>>): Promise<DbResult<User>> {
    const db = getFirestore(app);
    const docRef = doc(db, USER_COLLECTION, id);
    
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
    
    const { id: userId, ...userData } = parseResult.data;
    await updateDoc(docRef, userData);
    return { success: true, data: parseResult.data };
}

export async function deleteUser(id: string): Promise<void> {
    const db = getFirestore(app);
    const docRef = doc(db, USER_COLLECTION, id);
    await deleteDoc(docRef);
}

export async function getUserByEmail(email: string): Promise<DbResult<User>> {
    const db = getFirestore(app);
    const usersRef = collection(db, USER_COLLECTION);
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const result = USER_SCHEMA.safeParse({ id: doc.id, ...doc.data() });
        if (result.success) {
            return { success: true, data: result.data };
        } else {
            return { success: false, error: { message: "Invalid user data format" } };
        }
    } else {
        return { success: false, error: { message: "User not found with email" } };
    }
}

// Google OAuth 로그인 시 사용자 생성 또는 업데이트
export async function createOrUpdateUserFromGoogle(googleUserData: {
    email: string;
    name: string;
    picture?: string;
}): Promise<DbResult<User>> {
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