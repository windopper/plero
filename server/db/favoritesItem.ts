import { eq, and, count } from 'drizzle-orm';
import { db } from '.';
import { FAVORITES_ITEM_SCHEMA } from './schema';
import type { FavoritesItem } from './schema';
import type { DbResult } from '../type';

// 즐겨찾기 아이템 CRUD
export async function getFavoritesItem(id: string): Promise<DbResult<FavoritesItem>> {
    try {
        const result = await db
            .select()
            .from(FAVORITES_ITEM_SCHEMA)
            .where(eq(FAVORITES_ITEM_SCHEMA.id, id))
            .limit(1);

        if (result.length > 0) {
            return { success: true, data: result[0] };
        } else {
            return { success: false, error: { message: "Favorites item not found" } };
        }
    } catch (error) {
        return { success: false, error: { message: `Failed to get favorites item: ${error}` } };
    }
}

export async function addToFavorites(data: Omit<FavoritesItem, 'id' | 'createdAt'>): Promise<DbResult<FavoritesItem>> {
    try {
        // 이미 해당 목록에 추가되어 있는지 확인
        const existing = await getFavoritesItemByWikiAndList(data.wikiId, data.listId);
        if (existing.success) {
            return { success: false, error: { message: "Already added to this favorites list" } };
        }
        
        const itemData = {
            ...data,
            createdAt: new Date(),
        };
        
        const result = await db
            .insert(FAVORITES_ITEM_SCHEMA)
            .values({
                userId: itemData.userId,
                wikiId: itemData.wikiId,
                listId: itemData.listId,
                note: itemData.note,
                createdAt: itemData.createdAt,
            })
            .returning();

        return { success: true, data: result[0] };
    } catch (error) {
        return { success: false, error: { message: `Failed to add to favorites: ${error}` } };
    }
}

export async function removeFromFavorites(wikiId: string, listId: string): Promise<DbResult<void>> {
    try {
        const existing = await getFavoritesItemByWikiAndList(wikiId, listId);
        if (!existing.success) {
            return { success: false, error: { message: "Item not found in favorites list" } };
        }
        
        await db
            .delete(FAVORITES_ITEM_SCHEMA)
            .where(eq(FAVORITES_ITEM_SCHEMA.id, existing.data.id));

        return { success: true, data: undefined };
    } catch (error) {
        return { success: false, error: { message: `Failed to remove from favorites: ${error}` } };
    }
}

// 일반적으로 사용하지 않는 메서드
// 위키 삭제 시 위키와 관련된 모든 즐겨찾기 아이템 삭제
export async function removeItemsByWikiId(wikiId: string): Promise<DbResult<void>> {
    try {
        await db
            .delete(FAVORITES_ITEM_SCHEMA)
            .where(eq(FAVORITES_ITEM_SCHEMA.wikiId, wikiId));

        return { success: true, data: undefined };
    } catch (error) {
        return { success: false, error: { message: `Failed to remove items by wiki id: ${error}` } };
    }
}

export async function updateFavoritesItem(id: string, data: Partial<Omit<FavoritesItem, 'id' | 'createdAt'>>): Promise<DbResult<FavoritesItem>> {
    try {
        const updatedData = {
            userId: data.userId,
            wikiId: data.wikiId,
            listId: data.listId,
            note: data.note
        };
        
        const result = await db
            .update(FAVORITES_ITEM_SCHEMA)
            .set(updatedData)
            .where(eq(FAVORITES_ITEM_SCHEMA.id, id))
            .returning();

        if (result.length > 0) {
            return { success: true, data: result[0] };
        } else {
            return { success: false, error: { message: "Favorites item not found" } };
        }
    } catch (error) {
        return { success: false, error: { message: `Failed to update favorites item: ${error}` } };
    }
}

// 특정 위키와 목록으로 즐겨찾기 아이템 찾기
export async function getFavoritesItemByWikiAndList(wikiId: string, listId: string): Promise<DbResult<FavoritesItem>> {
    try {
        const result = await db
            .select()
            .from(FAVORITES_ITEM_SCHEMA)
            .where(and(
                eq(FAVORITES_ITEM_SCHEMA.wikiId, wikiId),
                eq(FAVORITES_ITEM_SCHEMA.listId, listId)
            ))
            .limit(1);

        if (result.length > 0) {
            return { success: true, data: result[0] };
        }
        
        return { success: false, error: { message: "Favorites item not found" } };
    } catch (error) {
        return { success: false, error: { message: `Failed to get favorites item: ${error}` } };
    }
}

// 목록별 즐겨찾기 아이템 조회
export async function getFavoritesItemsByList(listId: string): Promise<DbResult<FavoritesItem[]>> {
    try {
        const result = await db
            .select()
            .from(FAVORITES_ITEM_SCHEMA)
            .where(eq(FAVORITES_ITEM_SCHEMA.listId, listId));

        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: { message: `Failed to get favorites items: ${error}` } };
    }
}

// 사용자별 즐겨찾기 아이템 조회
export async function getUserFavoritesItems(userId: string): Promise<DbResult<FavoritesItem[]>> {
    try {
        const result = await db
            .select()
            .from(FAVORITES_ITEM_SCHEMA)
            .where(eq(FAVORITES_ITEM_SCHEMA.userId, userId));

        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: { message: `Failed to get user favorites items: ${error}` } };
    }
}

// 위키별 즐겨찾기 아이템 조회 (어떤 목록들에 속해있는지)
export async function getFavoritesItemsByWiki(wikiId: string): Promise<DbResult<FavoritesItem[]>> {
    try {
        const result = await db
            .select()
            .from(FAVORITES_ITEM_SCHEMA)
            .where(eq(FAVORITES_ITEM_SCHEMA.wikiId, wikiId));

        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: { message: `Failed to get wiki favorites items: ${error}` } };
    }
}

// 특정 사용자가 특정 위키를 즐겨찾기했는지 확인
export async function isWikiFavoritedByUser(userId: string, wikiId: string): Promise<DbResult<boolean>> {
    try {
        const result = await db
            .select()
            .from(FAVORITES_ITEM_SCHEMA)
            .where(and(
                eq(FAVORITES_ITEM_SCHEMA.userId, userId),
                eq(FAVORITES_ITEM_SCHEMA.wikiId, wikiId)
            ))
            .limit(1);

        return { success: true, data: result.length > 0 };
    } catch (error) {
        return { success: false, error: { message: `Failed to check if wiki is favorited: ${error}` } };
    }
}

// 위키의 총 즐겨찾기 수 계산
export async function getWikiFavoritesCount(wikiId: string): Promise<DbResult<number>> {
    try {
        const itemsResult = await getFavoritesItemsByWiki(wikiId);

        if (!itemsResult.success) {
            return itemsResult as DbResult<number>;
        }
        
        // 같은 유저 중복 처리
        const uniqueItems = new Set(itemsResult.data.map(item => item.userId));

        return { success: true, data: uniqueItems.size };
    } catch (error) {
        return { success: false, error: { message: `Failed to get wiki favorites count: ${error}` } };
    }
}

// 목록에서 모든 아이템 제거 (목록 삭제 시 사용)
export async function removeAllItemsFromList(listId: string): Promise<DbResult<void>> {
    try {
        await db
            .delete(FAVORITES_ITEM_SCHEMA)
            .where(eq(FAVORITES_ITEM_SCHEMA.listId, listId));
        
        return { success: true, data: undefined };
    } catch (error) {
        return { success: false, error: { message: `Failed to remove all items from list: ${error}` } };
    }
} 
