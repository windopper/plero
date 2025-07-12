import { 
    GetItemCommand, 
    PutItemCommand, 
    DeleteItemCommand, 
    ScanCommand, 
    QueryCommand,
    UpdateItemCommand,
    BatchWriteItemCommand
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import client from ".";
import { FAVORITES_LIST_COLLECTION } from "./constants";
import { FavoritesList, FAVORITES_LIST_SCHEMA } from "./schema";
import { v4 as uuidv4 } from 'uuid';
import type { DbResult } from '../type';

// 즐겨찾기 목록 CRUD
export async function getFavoritesList(id: string): Promise<DbResult<FavoritesList>> {
    try {
        const command = new GetItemCommand({
            TableName: FAVORITES_LIST_COLLECTION,
            Key: marshall({ id }),
        });

        const response = await client.send(command);
        
        if (response.Item) {
            const data = unmarshall(response.Item);
            const result = FAVORITES_LIST_SCHEMA.safeParse(data);
            if (result.success) {
                return { success: true, data: result.data };
            } else {
                return { success: false, error: { message: "Invalid favorites list data format" } };
            }
        } else {
            return { success: false, error: { message: "Favorites list not found" } };
        }
    } catch (error) {
        return { success: false, error: { message: `Failed to get favorites list: ${error}` } };
    }
}

export async function createFavoritesList(data: Omit<FavoritesList, 'id' | 'createdAt' | 'updatedAt'>): Promise<DbResult<FavoritesList>> {
    try {
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
        
        const command = new PutItemCommand({
            TableName: FAVORITES_LIST_COLLECTION,
            Item: marshall(parseResult.data),
        });

        await client.send(command);
        return { success: true, data: parseResult.data };
    } catch (error) {
        return { success: false, error: { message: `Failed to create favorites list: ${error}` } };
    }
}

export async function updateFavoritesList(id: string, data: Partial<Omit<FavoritesList, 'id' | 'createdAt'>>): Promise<DbResult<FavoritesList>> {
    try {
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
        
        const command = new PutItemCommand({
            TableName: FAVORITES_LIST_COLLECTION,
            Item: marshall(parseResult.data),
        });

        await client.send(command);
        return { success: true, data: parseResult.data };
    } catch (error) {
        return { success: false, error: { message: `Failed to update favorites list: ${error}` } };
    }
}

export async function deleteFavoritesList(id: string): Promise<DbResult<void>> {
    try {
        const command = new DeleteItemCommand({
            TableName: FAVORITES_LIST_COLLECTION,
            Key: marshall({ id }),
        });

        await client.send(command);
        return { success: true, data: undefined };
    } catch (error) {
        return { success: false, error: { message: `Failed to delete favorites list: ${error}` } };
    }
}

// 사용자별 즐겨찾기 목록 조회
export async function getUserFavoritesLists(userId: string): Promise<DbResult<FavoritesList[]>> {
    try {
        const command = new ScanCommand({
            TableName: FAVORITES_LIST_COLLECTION,
            FilterExpression: "userId = :userId",
            ExpressionAttributeValues: marshall({
                ":userId": userId
            }),
        });

        const response = await client.send(command);
        
        if (!response.Items) {
            return { success: true, data: [] };
        }

        const lists: FavoritesList[] = [];
        
        for (const item of response.Items) {
            const data = unmarshall(item);
            const result = FAVORITES_LIST_SCHEMA.safeParse(data);
            if (result.success) {
                lists.push(result.data);
            }
        }
        
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
    try {
        const command = new ScanCommand({
            TableName: FAVORITES_LIST_COLLECTION,
            FilterExpression: "userId = :userId AND isDefault = :isDefault",
            ExpressionAttributeValues: marshall({
                ":userId": userId,
                ":isDefault": true
            }),
        });

        const response = await client.send(command);
        
        if (response.Items && response.Items.length > 0) {
            const data = unmarshall(response.Items[0]);
            const result = FAVORITES_LIST_SCHEMA.safeParse(data);
            if (result.success) {
                return { success: true, data: result.data };
            }
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
            const currentList = await getFavoritesList(id);
            if (!currentList.success) {
                continue; // 실패한 항목은 건너뛰기
            }

            const updatedData = { ...currentList.data, sortOrder, updatedAt: Date.now() };
            
            const command = new PutItemCommand({
                TableName: FAVORITES_LIST_COLLECTION,
                Item: marshall(updatedData),
            });

            await client.send(command);
        }
        
        return { success: true, data: undefined };
    } catch (error) {
        return { success: false, error: { message: `Failed to update sort order: ${error}` } };
    }
} 