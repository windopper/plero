import { getFirestore, doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs, updateDoc, orderBy } from "firebase/firestore";
import app from ".";
import { FAVORITES_LIST_COLLECTION } from "./constants";
import { FavoritesList, FAVORITES_LIST_SCHEMA } from "./schema";
import { v4 as uuidv4 } from 'uuid';
import type { DbResult } from '../type';

// 즐겨찾기 목록 CRUD
export async function getFavoritesList(id: string): Promise<DbResult<FavoritesList>> {
    const db = getFirestore(app);
    const docRef = doc(db, FAVORITES_LIST_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
        const result = FAVORITES_LIST_SCHEMA.safeParse({ id, ...docSnap.data() });
        if (result.success) {
            return { success: true, data: result.data };
        } else {
            return { success: false, error: { message: "Invalid favorites list data format" } };
        }
    } else {
        return { success: false, error: { message: "Favorites list not found" } };
    }
}

export async function createFavoritesList(data: Omit<FavoritesList, 'id' | 'createdAt' | 'updatedAt'>): Promise<DbResult<FavoritesList>> {
    const db = getFirestore(app);
    const id = uuidv4();
    const now = Date.now();
    
    const listData: FavoritesList = {
        id,
        ...data,
        createdAt: now,
        updatedAt: now,
    };
    
    const parseResult = FAVORITES_LIST_SCHEMA.safeParse(listData);
    if (!parseResult.success) {
        return { success: false, error: { message: "Invalid favorites list data" } };
    }
    
    const docRef = doc(db, FAVORITES_LIST_COLLECTION, id);
    await setDoc(docRef, parseResult.data);
    return { success: true, data: parseResult.data };
}

export async function updateFavoritesList(id: string, data: Partial<Omit<FavoritesList, 'id' | 'createdAt'>>): Promise<DbResult<FavoritesList>> {
    const db = getFirestore(app);
    const docRef = doc(db, FAVORITES_LIST_COLLECTION, id);
    
    // 현재 목록 데이터 가져오기
    const currentList = await getFavoritesList(id);
    if (!currentList.success) {
        return currentList;
    }
    
    // 병합된 데이터 검증
    const mergedData = { ...currentList.data, ...data, updatedAt: Date.now() };
    const parseResult = FAVORITES_LIST_SCHEMA.safeParse(mergedData);
    
    if (!parseResult.success) {
        return { success: false, error: { message: "Invalid updated favorites list data" } };
    }
    
    await updateDoc(docRef, parseResult.data);
    return { success: true, data: parseResult.data };
}

export async function deleteFavoritesList(id: string): Promise<DbResult<void>> {
    const db = getFirestore(app);
    const docRef = doc(db, FAVORITES_LIST_COLLECTION, id);
    await deleteDoc(docRef);
    return { success: true, data: undefined };
}

// 사용자별 즐겨찾기 목록 조회
export async function getUserFavoritesLists(userId: string): Promise<DbResult<FavoritesList[]>> {
    const db = getFirestore(app);
    const listsRef = collection(db, FAVORITES_LIST_COLLECTION);
    const q = query(listsRef, where("userId", "==", userId));
    
    try {
        const querySnapshot = await getDocs(q);
        const lists: FavoritesList[] = [];
        
        querySnapshot.forEach((doc) => {
            const result = FAVORITES_LIST_SCHEMA.safeParse({ id: doc.id, ...doc.data() });
            if (result.success) {
                lists.push(result.data);
            }
        });
        
        // 메모리에서 정렬 (sortOrder 오름차순, 같을 경우 createdAt 오름차순)
        lists.sort((a, b) => {
            if (a.sortOrder !== b.sortOrder) {
                return a.sortOrder - b.sortOrder;
            }
            return a.createdAt - b.createdAt;
        });
        
        return { success: true, data: lists };
    } catch (error) {
        console.error("Error in getUserFavoritesLists:", error);
        return { success: false, error: { message: `Failed to get user favorites lists: ${error}` } };
    }
}

// 기본 즐겨찾기 목록 생성 (신규 사용자용)
export async function createDefaultFavoritesList(userId: string): Promise<DbResult<FavoritesList>> {
    return await createFavoritesList({
        userId,
        name: "기본 즐겨찾기",
        description: "기본 즐겨찾기 목록입니다.",
        isDefault: true,
        sortOrder: 0,
    });
}

// 사용자의 기본 즐겨찾기 목록 조회
export async function getUserDefaultFavoritesList(userId: string): Promise<DbResult<FavoritesList>> {
    const db = getFirestore(app);
    const listsRef = collection(db, FAVORITES_LIST_COLLECTION);
    const q = query(
        listsRef, 
        where("userId", "==", userId),
        where("isDefault", "==", true)
    );
    
    try {
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            const result = FAVORITES_LIST_SCHEMA.safeParse({ id: doc.id, ...doc.data() });
            if (result.success) {
                return { success: true, data: result.data };
            }
        }
        
        // 기본 목록이 없으면 생성
        return await createDefaultFavoritesList(userId);
    } catch (error) {
        return { success: false, error: { message: "Failed to get or create default favorites list" } };
    }
}

// 즐겨찾기 목록 정렬 순서 업데이트
export async function updateFavoritesListSortOrder(updates: { id: string; sortOrder: number }[]): Promise<DbResult<void>> {
    const db = getFirestore(app);
    
    try {
        const updatePromises = updates.map(async ({ id, sortOrder }) => {
            const docRef = doc(db, FAVORITES_LIST_COLLECTION, id);
            await updateDoc(docRef, { sortOrder, updatedAt: Date.now() });
        });
        
        await Promise.all(updatePromises);
        return { success: true, data: undefined };
    } catch (error) {
        return { success: false, error: { message: "Failed to update sort order" } };
    }
} 