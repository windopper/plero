import type { Wiki, User } from '~/server/db/schema';
import type { DbResult } from '~/server/type';
import { getWiki, setWiki, updateWiki, deleteWiki, getWikiList } from '~/server/db/wiki';

/**
 * DB 연결 및 기본 동작 테스트를 위한 헬퍼 함수
 */
export async function testDbConnection(): Promise<boolean> {
  try {
    const result = await getWikiList({ query: '', limit: 1 });
    return result.success;
  } catch (error) {
    console.error('DB connection test failed:', error);
    return false;
  }
}

/**
 * Wiki CRUD 검증을 위한 헬퍼 함수
 */
export async function validateWikiCrud(wikiData: Omit<Wiki, 'id'>): Promise<{
  success: boolean;
  wiki?: Wiki;
  error?: string;
}> {
  try {
    // 1. 생성 테스트
    const createResult = await setWiki(wikiData);
    if (!createResult.success) {
      return { success: false, error: 'Failed to create wiki' };
    }
    const wiki = createResult.data;

    // 2. 조회 테스트
    const getResult = await getWiki(wiki.id);
    if (!getResult.success) {
      return { success: false, error: 'Failed to get wiki' };
    }

    // 3. 수정 테스트
    const updateData = { title: wikiData.title + ' Updated' };
    const updateResult = await updateWiki(wiki.id, updateData);
    if (!updateResult.success) {
      return { success: false, error: 'Failed to update wiki' };
    }

    // 4. 삭제 테스트
    const deleteResult = await deleteWiki(wiki.id);
    if (!deleteResult.success) {
      return { success: false, error: 'Failed to delete wiki' };
    }

    return { success: true, wiki };
  } catch (error) {
    return { success: false, error: `CRUD validation failed: ${error}` };
  }
}

/**
 * 페이지네이션 테스트를 위한 헬퍼 함수
 */
export async function testPagination(
  totalItems: number,
  pageSize: number,
  query: string = ''
): Promise<{
  success: boolean;
  totalRetrieved: number;
  pagesCount: number;
  error?: string;
}> {
  try {
    let totalRetrieved = 0;
    let pagesCount = 0;
    let exclusiveStartKey: string | undefined;
    let hasMore = true;

    while (hasMore) {
      const result = await getWikiList({
        query,
        exclusiveStartKey,
        limit: pageSize,
      });

      if (!result.success) {
        return { success: false, totalRetrieved, pagesCount, error: 'Failed to get wiki list' };
      }

      totalRetrieved += result.data.wikis.length;
      pagesCount++;
      exclusiveStartKey = result.data.lastEvaluatedKey;
      hasMore = result.data.hasMore;

      // 무한 루프 방지
      if (pagesCount > 100) {
        return { success: false, totalRetrieved, pagesCount, error: 'Too many pages' };
      }
    }

    return { success: true, totalRetrieved, pagesCount };
  } catch (error) {
    return { success: false, totalRetrieved: 0, pagesCount: 0, error: `Pagination test failed: ${error}` };
  }
}

/**
 * 검색 기능 테스트를 위한 헬퍼 함수
 */
export async function testSearchFunctionality(
  searchTerm: string,
  expectedCount: number
): Promise<{
  success: boolean;
  actualCount: number;
  error?: string;
}> {
  try {
    const result = await getWikiList({ query: searchTerm, limit: 100 });
    if (!result.success) {
      return { success: false, actualCount: 0, error: 'Failed to search wikis' };
    }

    const actualCount = result.data.wikis.length;
    const success = actualCount >= expectedCount;

    return { success, actualCount };
  } catch (error) {
    return { success: false, actualCount: 0, error: `Search test failed: ${error}` };
  }
}

/**
 * 대량 데이터 삽입을 위한 헬퍼 함수
 */
export async function bulkCreateWikis(
  count: number,
  baseWikiData: Omit<Wiki, 'id'>,
  titlePrefix: string = 'Bulk Wiki'
): Promise<{
  success: boolean;
  wikis: Wiki[];
  error?: string;
}> {
  try {
    const wikis: Wiki[] = [];
    for (let i = 0; i < count; i++) {
      const wikiData = {
        ...baseWikiData,
        title: `${titlePrefix} ${i}`,
      };

      const result = await setWiki(wikiData);
      if (!result.success) {
        return { success: false, wikis, error: `Failed to create wiki ${i}` };
      }
      wikis.push(result.data);
    }

    return { success: true, wikis };
  } catch (error) {
    return { success: false, wikis: [], error: `Bulk creation failed: ${error}` };
  }
}

/**
 * 대량 데이터 정리를 위한 헬퍼 함수
 */
export async function bulkDeleteWikis(wikiIds: string[]): Promise<{
  success: boolean;
  deletedCount: number;
  error?: string;
}> {
  try {
    let deletedCount = 0;
    for (const wikiId of wikiIds) {
      const result = await deleteWiki(wikiId);
      if (result.success) {
        deletedCount++;
      }
    }

    return { success: true, deletedCount };
  } catch (error) {
    return { success: false, deletedCount: 0, error: `Bulk deletion failed: ${error}` };
  }
}

/**
 * 성능 테스트를 위한 헬퍼 함수
 */
export async function measureOperation<T>(
  operation: () => Promise<T>
): Promise<{
  result: T;
  executionTime: number;
}> {
  const startTime = performance.now();
  const result = await operation();
  const endTime = performance.now();
  const executionTime = endTime - startTime;

  return { result, executionTime };
}

/**
 * 에러 처리 테스트를 위한 헬퍼 함수
 */
export async function testErrorHandling(
  operation: () => Promise<DbResult<any>>,
  expectedErrorMessage?: string
): Promise<{
  success: boolean;
  errorMessage?: string;
  matchesExpected: boolean;
}> {
  try {
    const result = await operation();
    if (result.success) {
      return { success: false, matchesExpected: false };
    }

    const errorMessage = result.error.message;
    const matchesExpected = expectedErrorMessage ? errorMessage === expectedErrorMessage : true;

    return { success: true, errorMessage, matchesExpected };
  } catch (error) {
    return { success: false, errorMessage: String(error), matchesExpected: false };
  }
} 