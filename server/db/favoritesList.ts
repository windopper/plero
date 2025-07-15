import { eq, asc, and } from 'drizzle-orm';
import { db } from '.';
import { FAVORITES_LIST_SCHEMA } from './schema';
import type { FavoritesList } from './schema';
import type { DbResult } from '../type';

// 즐겨찾기 목록 CRUD
export async function getFavoritesList(id: string): Promise<DbResult<FavoritesList>> {
    try {
        const result = await db
            .select()
            .from(FAVORITES_LIST_SCHEMA)
            .where(eq(FAVORITES_LIST_SCHEMA.id, id))
            .limit(1);

        if (result.length > 0) {
            return { success: true, data: result[0] };
        } else {
            return { success: false, error: { message: "Favorites list not found" } };
        }
    } catch (error) {
        return { success: false, error: { message: `Failed to get favorites list: ${error}` } };
    }
}

export async function createFavoritesList(data: Omit<FavoritesList, 'id' | 'createdAt' | 'updatedAt'>): Promise<DbResult<FavoritesList>> {
    try {
        const listData = {
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        
        const result = await db
            .insert(FAVORITES_LIST_SCHEMA)
            .values(listData)
            .returning();

        return { success: true, data: result[0] };
    } catch (error) {
        return { success: false, error: { message: `Failed to create favorites list: ${error}` } };
    }
}

export async function updateFavoritesList(id: string, data: Partial<Omit<FavoritesList, 'id' | 'createdAt'>>): Promise<DbResult<FavoritesList>> {
    try {
        const updatedData = {
            ...data,
            updatedAt: new Date()
        };
        
        const result = await db
            .update(FAVORITES_LIST_SCHEMA)
            .set(updatedData)
            .where(eq(FAVORITES_LIST_SCHEMA.id, id))
            .returning();

        if (result.length > 0) {
            return { success: true, data: result[0] };
        } else {
            return { success: false, error: { message: "Favorites list not found" } };
        }
    } catch (error) {
        return { success: false, error: { message: `Failed to update favorites list: ${error}` } };
    }
}

export async function deleteFavoritesList(id: string): Promise<DbResult<void>> {
    try {
        await db
            .delete(FAVORITES_LIST_SCHEMA)
            .where(eq(FAVORITES_LIST_SCHEMA.id, id));

        return { success: true, data: undefined };
    } catch (error) {
        return { success: false, error: { message: `Failed to delete favorites list: ${error}` } };
    }
}

// 사용자별 즐겨찾기 목록 조회
export async function getUserFavoritesLists(userId: string): Promise<DbResult<FavoritesList[]>> {
    try {
        const lists = await db
            .select()
            .from(FAVORITES_LIST_SCHEMA)
            .where(eq(FAVORITES_LIST_SCHEMA.userId, userId))
            .orderBy(asc(FAVORITES_LIST_SCHEMA.sortOrder), asc(FAVORITES_LIST_SCHEMA.createdAt));
        
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
        color: null,
        isDefault: true,
        sortOrder: 0,
    });
}

// 사용자의 기본 즐겨찾기 목록 조회
export async function getUserDefaultFavoritesList(userId: string): Promise<DbResult<FavoritesList>> {
    try {
        const result = await db
            .select()
            .from(FAVORITES_LIST_SCHEMA)
            .where(and(
                eq(FAVORITES_LIST_SCHEMA.userId, userId),
                eq(FAVORITES_LIST_SCHEMA.isDefault, true)
            ))
            .limit(1);

        if (result.length > 0) {
            return { success: true, data: result[0] };
        }
        
        // 기본 목록이 없으면 생성
        return await createDefaultFavoritesList(userId);
    } catch (error) {
        return { success: false, error: { message: `Failed to get or create default favorites list: ${error}` } };
    }
}

// 즐겨찾기 목록 정렬 순서 업데이트
export async function updateFavoritesListSortOrder(updates: { id: string; sortOrder: number }[]): Promise<DbResult<void>> {
    try {
        // 각 업데이트를 순차적으로 처리
        for (const { id, sortOrder } of updates) {
            await db
                .update(FAVORITES_LIST_SCHEMA)
                .set({
                    sortOrder,
                    updatedAt: new Date()
                })
                .where(eq(FAVORITES_LIST_SCHEMA.id, id));
        }
        
        return { success: true, data: undefined };
    } catch (error) {
        return { success: false, error: { message: `Failed to update sort order: ${error}` } };
    }
} 