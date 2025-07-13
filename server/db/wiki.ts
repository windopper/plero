import { 
    GetItemCommand, 
    PutItemCommand, 
    DeleteItemCommand, 
    ScanCommand, 
    QueryCommand,
    UpdateItemCommand,
    BatchGetItemCommand
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import client from ".";
import { WIKI_COLLECTION } from "./constants";
import { Wiki, WIKI_SCHEMA } from "./schema";
import { v4 } from "uuid";
import type { DbResult } from "../type";

export async function getWiki(id: string): Promise<DbResult<Wiki>> {
    try {
        const command = new GetItemCommand({
            TableName: WIKI_COLLECTION,
            Key: marshall({ id }),
        });

        const response = await client.send(command);
        
        if (response.Item) {
            const data = unmarshall(response.Item);
            const result = WIKI_SCHEMA.safeParse(data);
            if (result.success) {
                return { success: true, data: result.data };
            } else {
                return { success: false, error: { message: result.error.message } };
            }
        } else {
            return {
                success: false,
                error: { message: "Wiki not found" },
            };
        }
    } catch (error) {
        return {
            success: false,
            error: { message: `Failed to get wiki: ${error}` },
        };
    }
}

export async function getWikisByIds(ids: string[]): Promise<DbResult<Wiki[]>> {
    try {
        const command = new BatchGetItemCommand({
            RequestItems: {
                [WIKI_COLLECTION]: {
                    Keys: ids.map(id => marshall({ id })),
                },
            },
        });

        const response = await client.send(command);

        if (!response.Responses) {
            return { success: false, error: { message: "Failed to get wikis" } };
        }

        return { success: true, data: response.Responses[WIKI_COLLECTION].map(item => {
            const data = unmarshall(item);
            const result = WIKI_SCHEMA.safeParse(data);
            return result.success ? result.data : null;
        }).filter(wiki => wiki !== null) as Wiki[] };
    } catch (error) {
        return { success: false, error: { message: `Failed to get wikis: ${error}` } };
    }
}

export async function getWikiList(options: {
  query: string;
  exclusiveStartKey?: string;
  limit: number;
} = {
  query: "",
  exclusiveStartKey: undefined,
  limit: 10,
}): Promise<
  DbResult<{ wikis: Wiki[]; lastEvaluatedKey?: string; hasMore: boolean }>
> {
  try {
    const { query: searchQuery, exclusiveStartKey, limit: pageLimit } = options;
    const actualLimit = pageLimit || 10;

    let command;

    const baseParams = {
      TableName: WIKI_COLLECTION,
      Limit: actualLimit,
      ...(exclusiveStartKey && {
        ExclusiveStartKey: JSON.parse(exclusiveStartKey),
      }),
    };

    if (searchQuery) {
      // 검색어가 있을 때는 FilterExpression을 사용하여 title에서 부분 일치 검색
      command = new ScanCommand({
        ...baseParams,
        FilterExpression:
          "contains(#title, :searchQuery) AND #isPublished = :isPublished",
        ExpressionAttributeNames: {
          "#title": "title",
          "#isPublished": "isPublished",
        },
        ExpressionAttributeValues: marshall({
          ":searchQuery": searchQuery,
          ":isPublished": true,
        }),
      });
    } else {
      // 검색어가 없을 때는 모든 위키를 가져옴
      command = new ScanCommand({
        ...baseParams,
        FilterExpression: "#isPublished = :isPublished",
        ExpressionAttributeNames: {
          "#isPublished": "isPublished",
        },
        ExpressionAttributeValues: marshall({
          ":isPublished": true,
        }),
      });
    }

    const response = await client.send(command);

    if (!response.Items) {
      return {
        success: true,
        data: {
          wikis: [],
          hasMore: false,
        },
      };
    }

    const wikis = response.Items.map((item) => {
      const data = unmarshall(item);
      const result = WIKI_SCHEMA.safeParse(data);
      return result.success ? result.data : null;
    }).filter((wiki) => wiki !== null) as Wiki[];

    const hasMore = !!response.LastEvaluatedKey;
    const lastEvaluatedKey = response.LastEvaluatedKey
      ? JSON.stringify(response.LastEvaluatedKey)
      : undefined;

    return {
      success: true,
      data: {
        wikis,
        lastEvaluatedKey,
        hasMore,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: { message: `Failed to get wiki list: ${error}` },
    };
  }
}

export async function getWikiListByAuthorId(
  authorId: string,
  options: {
    exclusiveStartKey?: string;
    limit: number;
    sort?: "asc" | "desc";
  } = {
    exclusiveStartKey: undefined,
    limit: 10,
    sort: "desc",
  }
): Promise<
  DbResult<{ wikis: Wiki[]; lastEvaluatedKey?: string; hasMore: boolean }>
> {
  try {
    const { exclusiveStartKey, limit: pageLimit, sort } = options;
    const actualLimit = pageLimit || 10;

    const command = new QueryCommand({
      TableName: WIKI_COLLECTION,
      IndexName: "authorId-updatedAt-index",
      KeyConditionExpression: "authorId = :authorId",
      ExpressionAttributeValues: marshall({
        ":authorId": authorId,
      }),
      ScanIndexForward: sort === "desc" ? false : true,
      Limit: actualLimit,
      ...(exclusiveStartKey && {
        ExclusiveStartKey: JSON.parse(exclusiveStartKey),
      }),
    });

    const response = await client.send(command);

    if (!response.Items) {
      return {
        success: true,
        data: { wikis: [], lastEvaluatedKey: undefined, hasMore: false },
      };
    }

    const wikis = response.Items.map((item) => {
      const data = unmarshall(item);
      const result = WIKI_SCHEMA.safeParse(data);
      return result.success ? result.data : null;
    }).filter((wiki) => wiki !== null) as Wiki[];

    const hasMore = !!response.LastEvaluatedKey;
    const lastEvaluatedKey = response.LastEvaluatedKey
      ? JSON.stringify(response.LastEvaluatedKey)
      : undefined;

    return { success: true, data: { wikis, lastEvaluatedKey, hasMore } };
  } catch (error) {
    return {
      success: false,
      error: { message: `Failed to get wiki list by author id: ${error}` },
    };
  }
}

export async function getWikiByTag(tag: string): Promise<DbResult<{wikis: {id: string, title: string}[], totalCount: number}>> {
    try {
        // %20을 공백으로 변환
        const decodedTag = tag.replace(/%20/g, ' ');
        
        const command = new ScanCommand({
            TableName: WIKI_COLLECTION,
            FilterExpression: "contains(tags, :tag)",
            ExpressionAttributeValues: marshall({
                ":tag": decodedTag
            }),
        });

        const response = await client.send(command);
        
        if (!response.Items) {
            return { success: true, data: { wikis: [], totalCount: 0 } };
        }

        const wikis = response.Items.map(item => {
            const data = unmarshall(item);
            const result = WIKI_SCHEMA.safeParse(data);
            if (result.success) {
                return {
                    id: result.data.id,
                    title: result.data.title,
                };
            }
            return null;
        }).filter(wiki => wiki !== null) as {id: string, title: string}[];

        const totalCount = wikis.length;
        return { success: true, data: { wikis, totalCount } };
    } catch (error) {
        return {
            success: false,
            error: { message: `Failed to get wiki by tag: ${error}` },
        };
    }
}

export async function setWiki(data: Omit<Wiki, 'id'>): Promise<DbResult<Wiki>> {
    try {
        const wikiId = v4(); // Generate a new UUID for the wiki
        const wikiData: Wiki = {
            id: wikiId,
            ...data,
        };

        const command = new PutItemCommand({
            TableName: WIKI_COLLECTION,
            Item: marshall(wikiData),
        });

        await client.send(command);
        return { success: true, data: wikiData };
    } catch (error) {
        return {
            success: false,
            error: { message: `Failed to create wiki: ${error}` },
        };
    }
}

export async function updateWiki(id: string, data: Partial<Omit<Wiki, 'id'>>): Promise<DbResult<Wiki>> {
    try {
        // 먼저 기존 데이터 조회
        const existingWiki = await getWiki(id);
        if (!existingWiki.success) {
            return existingWiki;
        }

        const updatedData = { ...existingWiki.data, ...data, updatedAt: Date.now() };

        const parseResult = WIKI_SCHEMA.safeParse(updatedData);
        if (!parseResult.success) {
            return {
                success: false,
                error: { message: "Invalid wiki data format" },
            };
        }

        const command = new PutItemCommand({
            TableName: WIKI_COLLECTION,
            Item: marshall(parseResult.data),
        });

        await client.send(command);
        return { success: true, data: parseResult.data };
    } catch (error) {
        return {
            success: false,
            error: { message: `Failed to update wiki: ${error}` },
        };
    }
}

export async function deleteWiki(id: string): Promise<DbResult<void>> {
    try {
        const command = new DeleteItemCommand({
            TableName: WIKI_COLLECTION,
            Key: marshall({ id }),
        });

        await client.send(command);
        return { success: true, data: undefined };
    } catch (error) {
        return {
            success: false,
            error: { message: `Failed to delete wiki: ${error}` },
        };
    }
}

export async function checkPublicWikiTitleExists(title: string, excludeId?: string): Promise<DbResult<boolean>> {
    try {
        const command = new ScanCommand({
            TableName: WIKI_COLLECTION,
            FilterExpression: "#title = :title AND #isPublished = :isPublished" + (excludeId ? " AND #id <> :excludeId" : ""),
            ExpressionAttributeNames: {
                "#title": "title",
                "#isPublished": "isPublished",
                ...(excludeId && { "#id": "id" })
            },
            ExpressionAttributeValues: marshall({
                ":title": title,
                ":isPublished": true,
                ...(excludeId && { ":excludeId": excludeId })
            }),
        });

        const response = await client.send(command);
        
        const exists = !!(response.Items && response.Items.length > 0);
        return { success: true, data: exists };
    } catch (error) {
        return {
            success: false,
            error: { message: `Failed to check title existence: ${error}` },
        };
    }
}

