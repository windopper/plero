import { eq, desc, asc, sql } from 'drizzle-orm';
import { db } from '.';
import { WIKI_HISTORY_SCHEMA } from './schema';
import type { WikiHistory } from './schema';
import type { DbResult } from '../type';

export async function getWikiHistoriesByWikiId(
  wikiId: string,
  options: {
    exclusiveStartKey?: string;
    limit: number;
    sort: "asc" | "desc";
  } = {
    exclusiveStartKey: undefined,
    limit: 10,
    sort: "desc"
  }
): Promise<DbResult<{histories: WikiHistory[], lastEvaluatedKey?: string, hasMore: boolean}>> {
  try {
    let offset = 0;
    if (options.exclusiveStartKey) {
      try {
        offset = parseInt(options.exclusiveStartKey);
      } catch {
        offset = 0;
      }
    }

    const orderBy = options.sort === "desc" ? desc(WIKI_HISTORY_SCHEMA.changedAt) : asc(WIKI_HISTORY_SCHEMA.changedAt);

    const histories = await db
      .select()
      .from(WIKI_HISTORY_SCHEMA)
      .where(eq(WIKI_HISTORY_SCHEMA.wikiId, wikiId))
      .orderBy(orderBy)
      .limit(options.limit + 1)
      .offset(offset);

    const hasMore = histories.length > options.limit;
    const resultHistories = hasMore ? histories.slice(0, options.limit) : histories;
    const lastEvaluatedKey = hasMore ? (offset + options.limit).toString() : undefined;

    return {
      success: true,
      data: {
        histories: resultHistories,
        lastEvaluatedKey,
        hasMore
      },
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
    const result = await db
      .select()
      .from(WIKI_HISTORY_SCHEMA)
      .where(eq(WIKI_HISTORY_SCHEMA.id, id))
      .limit(1);

    if (result.length > 0) {
      return { success: true, data: result[0] };
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
    
    let offset = 0;
    if (exclusiveStartKey) {
      try {
        offset = parseInt(exclusiveStartKey);
      } catch {
        offset = 0;
      }
    }

    const orderBy = sort === "asc" ? asc(WIKI_HISTORY_SCHEMA.changedAt) : desc(WIKI_HISTORY_SCHEMA.changedAt);

    const histories = await db
      .select()
      .from(WIKI_HISTORY_SCHEMA)
      .where(eq(WIKI_HISTORY_SCHEMA.changedBy, userId))
      .orderBy(orderBy)
      .limit(limit + 1)
      .offset(offset);

    const hasMore = histories.length > limit;
    const resultHistories = hasMore ? histories.slice(0, limit) : histories;
    const lastEvaluatedKey = hasMore ? (offset + limit).toString() : undefined;

    return { 
      success: true, 
      data: {
        histories: resultHistories,
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
    const result = await db
      .select()
      .from(WIKI_HISTORY_SCHEMA)
      .where(eq(WIKI_HISTORY_SCHEMA.wikiId, wikiId))
      .orderBy(desc(WIKI_HISTORY_SCHEMA.changedAt))
      .limit(1);

    if (result.length > 0) {
      return { success: true, data: result[0] };
    } else {
      return { success: false, error: { message: "Wiki history not found" } };
    }
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
    const result = await db
      .insert(WIKI_HISTORY_SCHEMA)
      .values(data)
      .returning();

    return { success: true, data: result[0] };
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
    const result = await db
      .update(WIKI_HISTORY_SCHEMA)
      .set(data)
      .where(eq(WIKI_HISTORY_SCHEMA.id, documentId))
      .returning();

    if (result.length > 0) {
      return { success: true, data: result[0] };
    } else {
      return { success: false, error: { message: "Wiki history not found" } };
    }
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

    await db
      .delete(WIKI_HISTORY_SCHEMA)
      .where(eq(WIKI_HISTORY_SCHEMA.id, documentId));

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
    await db
      .delete(WIKI_HISTORY_SCHEMA)
      .where(eq(WIKI_HISTORY_SCHEMA.wikiId, wikiId));

    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: { message: `Failed to delete wiki histories: ${error}` },
    };
  }
}
