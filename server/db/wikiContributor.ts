import { eq } from 'drizzle-orm';
import { db } from '.';
import { WIKI_CONTRIBUTORS_SCHEMA } from './schema';
import type { WikiContributor } from './schema';
import type { DbResult } from '../type';

export async function getWikiContributorsByWikiId(wikiId: string): Promise<DbResult<WikiContributor[]>> {
  try {
    const result = await db
      .select()
      .from(WIKI_CONTRIBUTORS_SCHEMA)
      .where(eq(WIKI_CONTRIBUTORS_SCHEMA.wikiId, wikiId));

    return {
      success: true,
      data: result,
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
    const result = await db
      .select()
      .from(WIKI_CONTRIBUTORS_SCHEMA)
      .where(eq(WIKI_CONTRIBUTORS_SCHEMA.id, id))
      .limit(1);

    if (result.length > 0) {
      return { success: true, data: result[0] };
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
    const result = await db
      .insert(WIKI_CONTRIBUTORS_SCHEMA)
      .values(contributor)
      .returning();

    return { success: true, data: result[0] };
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
    const updatedData = {
      wikiId: data.wikiId,
      contributorId: data.contributorId,
      contributorName: data.contributorName,
      contributorEmail: data.contributorEmail,
      contributedAt: data.contributedAt,
      firstContributedAt: data.firstContributedAt,
      linesAdded: data.linesAdded,
      linesRemoved: data.linesRemoved
    };

    const result = await db
      .update(WIKI_CONTRIBUTORS_SCHEMA)
      .set(updatedData)
      .where(eq(WIKI_CONTRIBUTORS_SCHEMA.id, id))
      .returning();

    if (result.length > 0) {
      return { success: true, data: result[0] };
    } else {
      return { success: false, error: { message: "Wiki contributor not found" } };
    }
  } catch (error) {
    return {
      success: false,
      error: { message: `Failed to update wiki contributor: ${error}` },
    };
  }
}

export async function deleteWikiContributor(id: string): Promise<DbResult<void>> {
  try {
    // 먼저 삭제할 데이터가 존재하는지 확인
    const existing = await getWikiContributor(id);
    if (!existing.success) {
      return { success: false, error: { message: "Wiki contributor not found" } };
    }

    await db
      .delete(WIKI_CONTRIBUTORS_SCHEMA)
      .where(eq(WIKI_CONTRIBUTORS_SCHEMA.id, id));

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
    await db
      .delete(WIKI_CONTRIBUTORS_SCHEMA)
      .where(eq(WIKI_CONTRIBUTORS_SCHEMA.wikiId, wikiId));

    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: { message: `Failed to delete wiki contributors: ${error}` },
    };
  }
}