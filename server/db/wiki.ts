import { eq, and, ilike, desc, asc, sql, count, inArray } from 'drizzle-orm';
import { db } from '.';
import { WIKI_SCHEMA } from './schema';
import type { Wiki } from './schema';
import type { DbResult } from '../type';

export async function getWiki(id: string): Promise<DbResult<Wiki>> {
    try {
        const result = await db
            .select()
            .from(WIKI_SCHEMA)
            .where(eq(WIKI_SCHEMA.id, id))
            .limit(1);

        if (result.length > 0) {
            return { success: true, data: result[0] };
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
        if (ids.length === 0) {
            return { success: true, data: [] };
        }

        const result = await db
            .select()
            .from(WIKI_SCHEMA)
            .where(inArray(WIKI_SCHEMA.id, ids));

        return { success: true, data: result };
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
    
    let offset = 0;
    if (exclusiveStartKey) {
      try {
        offset = parseInt(exclusiveStartKey);
      } catch {
        offset = 0;
      }
    }

    const whereConditions = [eq(WIKI_SCHEMA.isPublished, true)];
    if (searchQuery) {
      whereConditions.push(ilike(WIKI_SCHEMA.title, `%${searchQuery}%`));
    }

    const wikis = await db
      .select()
      .from(WIKI_SCHEMA)
      .where(and(...whereConditions))
      .orderBy(desc(WIKI_SCHEMA.updatedAt))
      .limit(actualLimit + 1) // +1 to check if there are more
      .offset(offset);

    const hasMore = wikis.length > actualLimit;
    const resultWikis = hasMore ? wikis.slice(0, actualLimit) : wikis;
    const lastEvaluatedKey = hasMore ? (offset + actualLimit).toString() : undefined;

    return {
      success: true,
      data: {
        wikis: resultWikis,
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

    let offset = 0;
    if (exclusiveStartKey) {
      try {
        offset = parseInt(exclusiveStartKey);
      } catch {
        offset = 0;
      }
    }

    const orderBy = sort === "desc" ? desc(WIKI_SCHEMA.updatedAt) : asc(WIKI_SCHEMA.updatedAt);

    const wikis = await db
      .select()
      .from(WIKI_SCHEMA)
      .where(eq(WIKI_SCHEMA.authorId, authorId))
      .orderBy(orderBy)
      .limit(actualLimit + 1)
      .offset(offset);

    const hasMore = wikis.length > actualLimit;
    const resultWikis = hasMore ? wikis.slice(0, actualLimit) : wikis;
    const lastEvaluatedKey = hasMore ? (offset + actualLimit).toString() : undefined;

    return { success: true, data: { wikis: resultWikis, lastEvaluatedKey, hasMore } };
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
        
        const result = await db
            .select({
                id: WIKI_SCHEMA.id,
                title: WIKI_SCHEMA.title,
            })
            .from(WIKI_SCHEMA)
            .where(sql`${WIKI_SCHEMA.tags} @> ${JSON.stringify([decodedTag])}`);

        const totalCount = result.length;
        return { success: true, data: { wikis: result, totalCount } };
    } catch (error) {
        return {
            success: false,
            error: { message: `Failed to get wiki by tag: ${error}` },
        };
    }
}

export async function setWiki(data: Omit<Wiki, 'id'>): Promise<DbResult<Wiki>> {
    try {
        const result = await db
            .insert(WIKI_SCHEMA)
            .values(data)
            .returning();

        return { success: true, data: result[0] };
    } catch (error) {
        return {
            success: false,
            error: { message: `Failed to create wiki: ${error}` },
        };
    }
}

export async function updateWiki(id: string, data: Partial<Omit<Wiki, 'id'>>): Promise<DbResult<Wiki>> {
    try {
        const updatedData = { ...data, updatedAt: new Date() };

        const result = await db
            .update(WIKI_SCHEMA)
            .set(updatedData)
            .where(eq(WIKI_SCHEMA.id, id))
            .returning();

        if (result.length > 0) {
            return { success: true, data: result[0] };
        } else {
            return {
                success: false,
                error: { message: "Wiki not found" },
            };
        }
    } catch (error) {
        return {
            success: false,
            error: { message: `Failed to update wiki: ${error}` },
        };
    }
}

export async function deleteWiki(id: string): Promise<DbResult<void>> {
    try {
        await db
            .delete(WIKI_SCHEMA)
            .where(eq(WIKI_SCHEMA.id, id));

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
        const whereConditions = [
            eq(WIKI_SCHEMA.title, title),
            eq(WIKI_SCHEMA.isPublished, true)
        ];

        if (excludeId) {
            whereConditions.push(sql`${WIKI_SCHEMA.id} != ${excludeId}`);
        }

        const result = await db
            .select({ count: count() })
            .from(WIKI_SCHEMA)
            .where(and(...whereConditions));

        const exists = result[0].count > 0;
        return { success: true, data: exists };
    } catch (error) {
        return {
            success: false,
            error: { message: `Failed to check title existence: ${error}` },
        };
    }
}

