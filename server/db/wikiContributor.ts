import { 
    GetItemCommand, 
    PutItemCommand, 
    DeleteItemCommand, 
    ScanCommand, 
    QueryCommand,
    BatchWriteItemCommand
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import client from ".";
import { WIKI_CONTRIBUTORS_COLLECTION } from "./constants";
import { User, WIKI_CONTRIBUTORS_SCHEMA, WikiContributor } from "./schema";
import { v4 } from "uuid";
import type { DbResult } from "../type";

export async function getWikiContributorsByWikiId(wikiId: string): Promise<DbResult<WikiContributor[]>> {
  try {
    const command = new ScanCommand({
      TableName: WIKI_CONTRIBUTORS_COLLECTION,
      FilterExpression: "wikiId = :wikiId",
      ExpressionAttributeValues: marshall({
        ":wikiId": wikiId
      }),
    });

    const response = await client.send(command);
    
    if (!response.Items || response.Items.length === 0) {
      return {
        success: true,
        data: [],
      };
    }
    
    const list = []
    for (const item of response.Items) {
      const data = unmarshall(item);
      const result = WIKI_CONTRIBUTORS_SCHEMA.safeParse(data);
      if (result.success) {
        list.push(result.data);
      } else {
        console.log(result.error);
      }
    }
    return {
      success: true,
      data: list,
    };
  } catch (error) {
    return {
      success: false,
      error: { message: `Failed to get wiki contributors: ${error}` },
    };
  }
}

export async function getWikiContributor(id: string): Promise<DbResult<WikiContributor>> {
  try {
    const command = new GetItemCommand({
      TableName: WIKI_CONTRIBUTORS_COLLECTION,
      Key: marshall({ id }),
    });

    const response = await client.send(command);
    
    if (response.Item) {
      const data = unmarshall(response.Item);
      const result = WIKI_CONTRIBUTORS_SCHEMA.safeParse(data);
      if (result.success) {
        return { success: true, data: result.data };
      } else {
        return { success: false, error: { message: "Invalid contributor data format" } };
      }
    } else {
      return {
        success: false,
        error: { message: "Wiki contributor not found" },
      };
    }
  } catch (error) {
    return {
      success: false,
      error: { message: `Failed to get wiki contributor: ${error}` },
    };
  }
}

export async function setWikiContributor(contributor: Omit<WikiContributor, 'id'>): Promise<DbResult<WikiContributor>> {
  try {
    const contributorId = v4(); // Generate a new UUID for the wiki contributor
    const contributorsData: WikiContributor = {
      id: contributorId,
      ...contributor,
    };

    const command = new PutItemCommand({
      TableName: WIKI_CONTRIBUTORS_COLLECTION,
      Item: marshall(contributorsData),
    });

    await client.send(command);
    return { success: true, data: contributorsData };
  } catch (error) {
    return {
      success: false,
      error: { message: `Failed to create wiki contributor: ${error}` },
    };
  }
}

export async function updateWikiContributor(
  id: string,
  data: Partial<Omit<WikiContributor, 'id'>>
): Promise<DbResult<WikiContributor>> {
  try {
    // 먼저 기존 데이터 조회
    const existing = await getWikiContributor(id);
    if (!existing.success) {
      return existing;
    }

    const updatedData = { ...existing.data, ...data };
    
    const parseResult = WIKI_CONTRIBUTORS_SCHEMA.safeParse(updatedData);
    if (!parseResult.success) {
      return { success: false, error: { message: "Invalid contributor data format" } };
    }

    const command = new PutItemCommand({
      TableName: WIKI_CONTRIBUTORS_COLLECTION,
      Item: marshall(parseResult.data),
    });

    await client.send(command);
    return { success: true, data: parseResult.data };
  } catch (error) {
    return {
      success: false,
      error: { message: `Failed to update wiki contributor: ${error}` },
    };
  }
}

export async function deleteWikiContributor(id: string): Promise<DbResult<void>> {
  try {
    const command = new DeleteItemCommand({
      TableName: WIKI_CONTRIBUTORS_COLLECTION,
      Key: marshall({ id }),
    });

    await client.send(command);
    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: { message: `Failed to delete wiki contributor: ${error}` },
    };
  }
}

export async function deleteWikiContributorsByWikiId(wikiId: string): Promise<DbResult<void>> {
  try {
    // 먼저 해당 wikiId의 모든 기여자를 조회
    const contributors = await getWikiContributorsByWikiId(wikiId);
    if (!contributors.success) {
      return contributors;
    }

    if (contributors.data.length === 0) {
      return { success: true, data: undefined };
    }

    // BatchWriteItem으로 일괄 삭제 (최대 25개씩)
    const batchSize = 25;
    const batches = [];
    
    for (let i = 0; i < contributors.data.length; i += batchSize) {
      const batch = contributors.data.slice(i, i + batchSize);
      batches.push(batch);
    }

    for (const batch of batches) {
      const deleteRequests = batch.map(contributor => ({
        DeleteRequest: {
          Key: marshall({ id: contributor.id })
        }
      }));

      const command = new BatchWriteItemCommand({
        RequestItems: {
          [WIKI_CONTRIBUTORS_COLLECTION]: deleteRequests
        }
      });

      await client.send(command);
    }

    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: { message: `Failed to delete wiki contributors: ${error}` },
    };
  }
}