import {
  GetItemCommand,
  PutItemCommand,
  DeleteItemCommand,
  ScanCommand,
  QueryCommand,
  BatchWriteItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import client from ".";
import { WIKI_HISTORY_COLLECTION } from "./constants";
import { WIKI_HISTORY_SCHEMA, WikiHistory } from "./schema";
import { v4 } from "uuid";
import { getWikiContentHash, getWikiContentSize } from "../../utils/wiki";
import type { DbResult } from "../type";

export async function getWikiHistoriesByWikiId(
  wikiId: string
): Promise<DbResult<WikiHistory[]>> {
  try {
    const command = new ScanCommand({
      TableName: WIKI_HISTORY_COLLECTION,
      FilterExpression: "wikiId = :wikiId",
      ExpressionAttributeValues: marshall({
        ":wikiId": wikiId
      }),
    });

    const response = await client.send(command);
    
    if (!response.Items || response.Items.length === 0) {
      return { success: true, data: [] };
    }

    const histories = response.Items
      .map(item => {
        const data = unmarshall(item);
        const result = WIKI_HISTORY_SCHEMA.safeParse(data);
        return result.success ? result.data : null;
      })
      .filter(history => history !== null) as WikiHistory[];

    // changedAt으로 내림차순 정렬
    histories.sort((a, b) => b.changedAt - a.changedAt);

    return {
      success: true,
      data: histories,
    };
  } catch (error) {
    return {
      success: false,
      error: { message: `Failed to get wiki histories: ${error}` },
    };
  }
}

export async function getWikiHistory(
  id: string
): Promise<DbResult<WikiHistory>> {
  try {
    const command = new GetItemCommand({
      TableName: WIKI_HISTORY_COLLECTION,
      Key: marshall({ id }),
    });

    const response = await client.send(command);
    
    if (response.Item) {
      const data = unmarshall(response.Item);
      const result = WIKI_HISTORY_SCHEMA.safeParse(data);
      if (result.success) {
        return { success: true, data: result.data };
      } else {
        return {
          success: false,
          error: { message: "Invalid wiki history data format" },
        };
      }
    } else {
      return { success: false, error: { message: "Wiki history not found" } };
    }
  } catch (error) {
    return {
      success: false,
      error: { message: `Failed to get wiki history: ${error}` },
    };
  }
}

export async function getWikiHistoriesByUserId(options: {
  userId: string,
  exclusiveStartKey?: string,
  limit: number,
  sort: "asc" | "desc"
} = {
  userId: "",
  exclusiveStartKey: undefined,
  limit: 30,
  sort: "desc"
}): Promise<DbResult<{histories: WikiHistory[], lastEvaluatedKey?: string, hasMore: boolean}>> {
  try {
    const { userId, exclusiveStartKey, limit, sort } = options;
    
    const baseParams = {
      TableName: WIKI_HISTORY_COLLECTION,
      IndexName: "changedBy-changedAt-index", // GSI 필요
      KeyConditionExpression: "changedBy = :userId",
      ExpressionAttributeValues: marshall({
        ":userId": userId
      }),
      ScanIndexForward: sort === "asc" ? true : false, // 내림차순 정렬
      Limit: limit,
      ...(exclusiveStartKey && { ExclusiveStartKey: JSON.parse(exclusiveStartKey) })
    };

    const command = new QueryCommand(baseParams);
    const response = await client.send(command);

    if (!response.Items || response.Items.length === 0) {
      return { 
        success: true, 
        data: {
          histories: [],
          hasMore: false
        }
      };
    }

    const histories = response.Items
      .map(item => {
        const data = unmarshall(item);
        const result = WIKI_HISTORY_SCHEMA.safeParse(data);
        return result.success ? result.data : null;
      })
      .filter(history => history !== null) as WikiHistory[];

    const hasMore = !!response.LastEvaluatedKey;
    const lastEvaluatedKey = response.LastEvaluatedKey ? JSON.stringify(response.LastEvaluatedKey) : undefined;

    return { 
      success: true, 
      data: {
        histories,
        lastEvaluatedKey,
        hasMore
      }
    };
  } catch (error) {
    return {
      success: false,
      error: { message: `Failed to get wiki histories by user id: ${error}` },
    };
  }
} 

export async function getLatestWikiHistory(
  wikiId: string
): Promise<DbResult<WikiHistory>> {
  try {
    const command = new ScanCommand({
      TableName: WIKI_HISTORY_COLLECTION,
      FilterExpression: "wikiId = :wikiId",
      ExpressionAttributeValues: marshall({
        ":wikiId": wikiId
      }),
    });

    const response = await client.send(command);
    
    if (!response.Items || response.Items.length === 0) {
      return { success: false, error: { message: "Wiki history not found" } };
    }

    // 모든 히스토리를 가져와서 changedAt으로 정렬하여 최신 것 반환
    const histories = response.Items
      .map(item => {
        const data = unmarshall(item);
        const result = WIKI_HISTORY_SCHEMA.safeParse(data);
        return result.success ? result.data : null;
      })
      .filter(history => history !== null) as WikiHistory[];

    if (histories.length === 0) {
      return { success: false, error: { message: "Wiki history not found" } };
    }

    // changedAt으로 내림차순 정렬하여 최신 것 반환
    histories.sort((a, b) => b.changedAt - a.changedAt);
    
    return { success: true, data: histories[0] };
  } catch (error) {
    return {
      success: false,
      error: { message: `Failed to get latest wiki history: ${error}` },
    };
  }
}

export async function setWikiHistory(
  data: Omit<WikiHistory, "id">
): Promise<DbResult<WikiHistory>> {
  try {
    const historyId = v4();
    const historyData: WikiHistory = {
      id: historyId,
      ...data,
    };

    const command = new PutItemCommand({
      TableName: WIKI_HISTORY_COLLECTION,
      Item: marshall(historyData),
    });

    await client.send(command);
    return { success: true, data: historyData };
  } catch (error) {
    return {
      success: false,
      error: { message: `Failed to create wiki history: ${error}` },
    };
  }
}

export async function updateWikiHistory(
  documentId: string,
  data: Partial<Omit<WikiHistory, "id">>
): Promise<DbResult<WikiHistory>> {
  try {
    // 먼저 기존 데이터 조회
    const existing = await getWikiHistory(documentId);
    if (!existing.success) {
      return existing;
    }

    const updatedHistoryData = { ...existing.data, ...data };
    
    const parseResult = WIKI_HISTORY_SCHEMA.safeParse(updatedHistoryData);
    if (!parseResult.success) {
      return { success: false, error: { message: "Invalid wiki history data format" } };
    }

    const command = new PutItemCommand({
      TableName: WIKI_HISTORY_COLLECTION,
      Item: marshall(parseResult.data),
    });

    await client.send(command);
    return { success: true, data: parseResult.data };
  } catch (error) {
    return {
      success: false,
      error: { message: `Failed to update wiki history: ${error}` },
    };
  }
}

export async function deleteWikiHistory(
  documentId: string
): Promise<DbResult<WikiHistory>> {
  try {
    // 먼저 삭제할 데이터 조회
    const existing = await getWikiHistory(documentId);
    if (!existing.success) {
      return existing;
    }

    const command = new DeleteItemCommand({
      TableName: WIKI_HISTORY_COLLECTION,
      Key: marshall({ id: documentId }),
    });

    await client.send(command);
    return { success: true, data: existing.data };
  } catch (error) {
    return {
      success: false,
      error: { message: `Failed to delete wiki history: ${error}` },
    };
  }
}

export async function deleteWikiHistoriesByWikiId(
  wikiId: string
): Promise<DbResult<void>> {
  try {
    // 먼저 해당 wikiId의 모든 히스토리를 조회
    const histories = await getWikiHistoriesByWikiId(wikiId);
    if (!histories.success) {
      return histories;
    }

    if (histories.data.length === 0) {
      return { success: true, data: undefined };
    }

    // BatchWriteItem으로 일괄 삭제 (최대 25개씩)
    const batchSize = 25;
    const batches = [];
    
    for (let i = 0; i < histories.data.length; i += batchSize) {
      const batch = histories.data.slice(i, i + batchSize);
      batches.push(batch);
    }

    for (const batch of batches) {
      const deleteRequests = batch.map(history => ({
        DeleteRequest: {
          Key: marshall({ id: history.id })
        }
      }));

      const command = new BatchWriteItemCommand({
        RequestItems: {
          [WIKI_HISTORY_COLLECTION]: deleteRequests
        }
      });

      await client.send(command);
    }

    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: { message: `Failed to delete wiki histories: ${error}` },
    };
  }
}
