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
import { FAVORITES_ITEM_COLLECTION } from "./constants";
import { FavoritesItem, FAVORITES_ITEM_SCHEMA } from "./schema";
import { v4 as uuidv4 } from 'uuid';
import type { DbResult } from '../type';

// 즐겨찾기 아이템 CRUD
export async function getFavoritesItem(id: string): Promise<DbResult<FavoritesItem>> {
    try {
        const command = new GetItemCommand({
            TableName: FAVORITES_ITEM_COLLECTION,
            Key: marshall({ id }),
        });

        const response = await client.send(command);
        
        if (response.Item) {
            const data = unmarshall(response.Item);
            const result = FAVORITES_ITEM_SCHEMA.safeParse(data);
            if (result.success) {
                return { success: true, data: result.data };
            } else {
                return { success: false, error: { message: "Invalid favorites item data format" } };
            }
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
        
        const command = new PutItemCommand({
            TableName: FAVORITES_ITEM_COLLECTION,
            Item: marshall(parseResult.data),
        });

        await client.send(command);
        return { success: true, data: parseResult.data };
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
        
        const command = new DeleteItemCommand({
            TableName: FAVORITES_ITEM_COLLECTION,
            Key: marshall({ id: existing.data.id }),
        });

        await client.send(command);
        return { success: true, data: undefined };
    } catch (error) {
        return { success: false, error: { message: `Failed to remove from favorites: ${error}` } };
    }
}

// 일반적으로 사용하지 않는 메서드
// 위키 삭제 시 위키와 관련된 모든 즐겨찾기 아이템 삭제
export async function removeItemsByWikiId(wikiId: string): Promise<DbResult<void>> {
    try {
        const command = new DeleteItemCommand({
            TableName: FAVORITES_ITEM_COLLECTION,
            Key: marshall({ wikiId }),
        });

        await client.send(command);
        return { success: true, data: undefined };
    } catch (error) {
        return { success: false, error: { message: `Failed to remove items by wiki id: ${error}` } };
    }
}

export async function updateFavoritesItem(id: string, data: Partial<Omit<FavoritesItem, 'id' | 'createdAt'>>): Promise<DbResult<FavoritesItem>> {
    try {
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
        
        const command = new PutItemCommand({
            TableName: FAVORITES_ITEM_COLLECTION,
            Item: marshall(parseResult.data),
        });

        await client.send(command);
        return { success: true, data: parseResult.data };
    } catch (error) {
        return { success: false, error: { message: `Failed to update favorites item: ${error}` } };
    }
}

// 특정 위키와 목록으로 즐겨찾기 아이템 찾기
export async function getFavoritesItemByWikiAndList(wikiId: string, listId: string): Promise<DbResult<FavoritesItem>> {
    try {
        const command = new ScanCommand({
            TableName: FAVORITES_ITEM_COLLECTION,
            FilterExpression: "wikiId = :wikiId AND listId = :listId",
            ExpressionAttributeValues: marshall({
                ":wikiId": wikiId,
                ":listId": listId
            }),
        });

        const response = await client.send(command);
        
        if (response.Items && response.Items.length > 0) {
            const data = unmarshall(response.Items[0]);
            const result = FAVORITES_ITEM_SCHEMA.safeParse(data);
            if (result.success) {
                return { success: true, data: result.data };
            }
        }
        
        return { success: false, error: { message: "Favorites item not found" } };
    } catch (error) {
        return { success: false, error: { message: `Failed to get favorites item: ${error}` } };
    }
}

// 목록별 즐겨찾기 아이템 조회
export async function getFavoritesItemsByList(listId: string): Promise<DbResult<FavoritesItem[]>> {
    try {
        const command = new ScanCommand({
            TableName: FAVORITES_ITEM_COLLECTION,
            FilterExpression: "listId = :listId",
            ExpressionAttributeValues: marshall({
                ":listId": listId
            }),
        });

        const response = await client.send(command);
        
        if (!response.Items) {
            return { success: true, data: [] };
        }

        const items: FavoritesItem[] = [];
        
        for (const item of response.Items) {
            const data = unmarshall(item);
            const result = FAVORITES_ITEM_SCHEMA.safeParse(data);
            if (result.success) {
                items.push(result.data);
            }
        }
        
        return { success: true, data: items };
    } catch (error) {
        return { success: false, error: { message: `Failed to get favorites items: ${error}` } };
    }
}

// 사용자별 즐겨찾기 아이템 조회
export async function getUserFavoritesItems(userId: string): Promise<DbResult<FavoritesItem[]>> {
    try {
        const command = new ScanCommand({
            TableName: FAVORITES_ITEM_COLLECTION,
            FilterExpression: "userId = :userId",
            ExpressionAttributeValues: marshall({
                ":userId": userId
            }),
        });

        const response = await client.send(command);
        
        if (!response.Items) {
            return { success: true, data: [] };
        }

        const items: FavoritesItem[] = [];
        
        for (const item of response.Items) {
            const data = unmarshall(item);
            const result = FAVORITES_ITEM_SCHEMA.safeParse(data);
            if (result.success) {
                items.push(result.data);
            }
        }
        
        return { success: true, data: items };
    } catch (error) {
        return { success: false, error: { message: `Failed to get user favorites items: ${error}` } };
    }
}

// 위키별 즐겨찾기 아이템 조회 (어떤 목록들에 속해있는지)
export async function getFavoritesItemsByWiki(wikiId: string): Promise<DbResult<FavoritesItem[]>> {
    try {
        const command = new ScanCommand({
            TableName: FAVORITES_ITEM_COLLECTION,
            FilterExpression: "wikiId = :wikiId",
            ExpressionAttributeValues: marshall({
                ":wikiId": wikiId
            }),
        });

        const response = await client.send(command);
        
        if (!response.Items) {
            return { success: true, data: [] };
        }

        const items: FavoritesItem[] = [];
        
        for (const item of response.Items) {
            const data = unmarshall(item);
            const result = FAVORITES_ITEM_SCHEMA.safeParse(data);
            if (result.success) {
                items.push(result.data);
            }
        }
        
        return { success: true, data: items };
    } catch (error) {
        return { success: false, error: { message: `Failed to get wiki favorites items: ${error}` } };
    }
}

// 특정 사용자가 특정 위키를 즐겨찾기했는지 확인
export async function isWikiFavoritedByUser(userId: string, wikiId: string): Promise<DbResult<boolean>> {
    try {
        const command = new ScanCommand({
            TableName: FAVORITES_ITEM_COLLECTION,
            FilterExpression: "userId = :userId AND wikiId = :wikiId",
            ExpressionAttributeValues: marshall({
                ":userId": userId,
                ":wikiId": wikiId
            }),
        });

        const response = await client.send(command);
        
        return { success: true, data: response.Items ? response.Items.length > 0 : false };
    } catch (error) {
        return { success: false, error: { message: `Failed to check if wiki is favorited: ${error}` } };
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
    try {
        const itemsResult = await getFavoritesItemsByList(listId);
        if (!itemsResult.success) {
            return { success: true, data: undefined }; // 아이템이 없어도 성공
        }

        if (itemsResult.data.length === 0) {
            return { success: true, data: undefined };
        }
        
        // BatchWriteItem으로 일괄 삭제 (최대 25개씩)
        const batchSize = 25;
        const batches = [];
        
        for (let i = 0; i < itemsResult.data.length; i += batchSize) {
            const batch = itemsResult.data.slice(i, i + batchSize);
            batches.push(batch);
        }

        for (const batch of batches) {
            const deleteRequests = batch.map(item => ({
                DeleteRequest: {
                    Key: marshall({ id: item.id })
                }
            }));

            const command = new BatchWriteItemCommand({
                RequestItems: {
                    [FAVORITES_ITEM_COLLECTION]: deleteRequests
                }
            });

            await client.send(command);
        }
        
        return { success: true, data: undefined };
    } catch (error) {
        return { success: false, error: { message: `Failed to remove all items from list: ${error}` } };
    }
} 
