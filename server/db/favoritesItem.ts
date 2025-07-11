import { getFirestore, doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import app from ".";
import { FAVORITES_ITEM_COLLECTION } from "./constants";
import { FavoritesItem, FAVORITES_ITEM_SCHEMA } from "./schema";
import { v4 as uuidv4 } from 'uuid';
import type { DbResult } from '../type';

// 즐겨찾기 아이템 CRUD
export async function getFavoritesItem(id: string): Promise<DbResult<FavoritesItem>> {
    const db = getFirestore(app);
    const docRef = doc(db, FAVORITES_ITEM_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
        const result = FAVORITES_ITEM_SCHEMA.safeParse({ id, ...docSnap.data() });
        if (result.success) {
            return { success: true, data: result.data };
        } else {
            return { success: false, error: { message: "Invalid favorites item data format" } };
        }
    } else {
        return { success: false, error: { message: "Favorites item not found" } };
    }
}

export async function addToFavorites(data: Omit<FavoritesItem, 'id' | 'createdAt'>): Promise<DbResult<FavoritesItem>> {
    const db = getFirestore(app);
    
    // 이미 해당 목록에 추가되어 있는지 확인
    const existing = await getFavoritesItemByWikiAndList(data.wikiId, data.listId);
    if (existing.success) {
        return { success: false, error: { message: "Already added to this favorites list" } };
    }
    
    const id = uuidv4();
    const now = Date.now();
    
    const itemData: FavoritesItem = {
        id,
        ...data,
        createdAt: now,
    };
    
    const parseResult = FAVORITES_ITEM_SCHEMA.safeParse(itemData);
    if (!parseResult.success) {
        return { success: false, error: { message: "Invalid favorites item data" } };
    }
    
    const docRef = doc(db, FAVORITES_ITEM_COLLECTION, id);
    await setDoc(docRef, parseResult.data);
    return { success: true, data: parseResult.data };
}

export async function removeFromFavorites(wikiId: string, listId: string): Promise<DbResult<void>> {
    const existing = await getFavoritesItemByWikiAndList(wikiId, listId);
    if (!existing.success) {
        return { success: false, error: { message: "Item not found in favorites list" } };
    }
    
    const db = getFirestore(app);
    const docRef = doc(db, FAVORITES_ITEM_COLLECTION, existing.data.id);
    await deleteDoc(docRef);
    return { success: true, data: undefined };
}

export async function updateFavoritesItem(id: string, data: Partial<Omit<FavoritesItem, 'id' | 'createdAt'>>): Promise<DbResult<FavoritesItem>> {
    const db = getFirestore(app);
    const docRef = doc(db, FAVORITES_ITEM_COLLECTION, id);
    
    // 현재 아이템 데이터 가져오기
    const currentItem = await getFavoritesItem(id);
    if (!currentItem.success) {
        return currentItem;
    }
    
    // 병합된 데이터 검증
    const mergedData = { ...currentItem.data, ...data };
    const parseResult = FAVORITES_ITEM_SCHEMA.safeParse(mergedData);
    
    if (!parseResult.success) {
        return { success: false, error: { message: "Invalid updated favorites item data" } };
    }
    
    await updateDoc(docRef, parseResult.data);
    return { success: true, data: parseResult.data };
}

// 특정 위키와 목록으로 즐겨찾기 아이템 찾기
export async function getFavoritesItemByWikiAndList(wikiId: string, listId: string): Promise<DbResult<FavoritesItem>> {
    const db = getFirestore(app);
    const itemsRef = collection(db, FAVORITES_ITEM_COLLECTION);
    const q = query(
        itemsRef, 
        where("wikiId", "==", wikiId),
        where("listId", "==", listId)
    );
    
    try {
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            const result = FAVORITES_ITEM_SCHEMA.safeParse({ id: doc.id, ...doc.data() });
            if (result.success) {
                return { success: true, data: result.data };
            }
        }
        
        return { success: false, error: { message: "Favorites item not found" } };
    } catch (error) {
        return { success: false, error: { message: "Failed to get favorites item" } };
    }
}

// 목록별 즐겨찾기 아이템 조회
export async function getFavoritesItemsByList(listId: string): Promise<DbResult<FavoritesItem[]>> {
    const db = getFirestore(app);
    const itemsRef = collection(db, FAVORITES_ITEM_COLLECTION);
    const q = query(itemsRef, where("listId", "==", listId));
    
    try {
        const querySnapshot = await getDocs(q);
        const items: FavoritesItem[] = [];
        
        querySnapshot.forEach((doc) => {
            const result = FAVORITES_ITEM_SCHEMA.safeParse({ id: doc.id, ...doc.data() });
            if (result.success) {
                items.push(result.data);
            }
        });
        
        return { success: true, data: items };
    } catch (error) {
        return { success: false, error: { message: "Failed to get favorites items" } };
    }
}

// 사용자별 즐겨찾기 아이템 조회
export async function getUserFavoritesItems(userId: string): Promise<DbResult<FavoritesItem[]>> {
    const db = getFirestore(app);
    const itemsRef = collection(db, FAVORITES_ITEM_COLLECTION);
    const q = query(itemsRef, where("userId", "==", userId));
    
    try {
        const querySnapshot = await getDocs(q);
        const items: FavoritesItem[] = [];
        
        querySnapshot.forEach((doc) => {
            const result = FAVORITES_ITEM_SCHEMA.safeParse({ id: doc.id, ...doc.data() });
            if (result.success) {
                items.push(result.data);
            }
        });
        
        return { success: true, data: items };
    } catch (error) {
        return { success: false, error: { message: "Failed to get user favorites items" } };
    }
}

// 위키별 즐겨찾기 아이템 조회 (어떤 목록들에 속해있는지)
export async function getFavoritesItemsByWiki(wikiId: string): Promise<DbResult<FavoritesItem[]>> {
    const db = getFirestore(app);
    const itemsRef = collection(db, FAVORITES_ITEM_COLLECTION);
    const q = query(itemsRef, where("wikiId", "==", wikiId));
    
    try {
        const querySnapshot = await getDocs(q);
        const items: FavoritesItem[] = [];
        
        querySnapshot.forEach((doc) => {
            const result = FAVORITES_ITEM_SCHEMA.safeParse({ id: doc.id, ...doc.data() });
            if (result.success) {
                items.push(result.data);
            }
        });
        
        return { success: true, data: items };
    } catch (error) {
        return { success: false, error: { message: "Failed to get wiki favorites items" } };
    }
}

// 특정 사용자가 특정 위키를 즐겨찾기했는지 확인
export async function isWikiFavoritedByUser(userId: string, wikiId: string): Promise<DbResult<boolean>> {
    const db = getFirestore(app);
    const itemsRef = collection(db, FAVORITES_ITEM_COLLECTION);
    const q = query(
        itemsRef, 
        where("userId", "==", userId),
        where("wikiId", "==", wikiId)
    );
    
    try {
        const querySnapshot = await getDocs(q);
        return { success: true, data: !querySnapshot.empty };
    } catch (error) {
        return { success: false, error: { message: "Failed to check if wiki is favorited" } };
    }
}

// 위키의 총 즐겨찾기 수 계산
export async function getWikiFavoritesCount(wikiId: string): Promise<DbResult<number>> {
    const itemsResult = await getFavoritesItemsByWiki(wikiId);

    if (!itemsResult.success) {
        return itemsResult as DbResult<number>;
    }
    
    // 같은 유저 중복 처리
    const uniqueItems = new Set(itemsResult.data.map(item => item.userId));

    return { success: true, data: uniqueItems.size };
}

// 목록에서 모든 아이템 제거 (목록 삭제 시 사용)
export async function removeAllItemsFromList(listId: string): Promise<DbResult<void>> {
    const itemsResult = await getFavoritesItemsByList(listId);
    if (!itemsResult.success) {
        return { success: true, data: undefined }; // 아이템이 없어도 성공
    }
    
    const db = getFirestore(app);
    const deletePromises = itemsResult.data.map(async (item) => {
        const docRef = doc(db, FAVORITES_ITEM_COLLECTION, item.id);
        await deleteDoc(docRef);
    });
    
    try {
        await Promise.all(deletePromises);
        return { success: true, data: undefined };
    } catch (error) {
        return { success: false, error: { message: "Failed to remove all items from list" } };
    }
} 