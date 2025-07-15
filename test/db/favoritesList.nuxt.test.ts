// @vitest-environment nuxt
import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { createMockFavoritesList, createMockUsers } from '../mock';
import { 
  getFavoritesList, 
  createFavoritesList, 
  updateFavoritesList, 
  deleteFavoritesList,
  getUserFavoritesLists,
  createDefaultFavoritesList,
  getUserDefaultFavoritesList,
  updateFavoritesListSortOrder
} from '~/server/db/favoritesList';
import { v4 } from 'uuid';

describe("Favorites List DB Integration Tests", () => {
  let createdLists: string[] = [];

  afterEach(async () => {
    // 각 테스트 후 cleanup if needed
  });

  afterAll(async () => {
    // 전역 cleanup은 각 테스트의 cleanUp 함수에서 처리
  });

  it("즐겨찾기 목록 생성 및 조회", async () => {
    const { favoritesList, cleanUpFavoritesList } = await createMockFavoritesList();

    const getResult = await getFavoritesList(favoritesList.id);
    expect(getResult.success).toBe(true);
    
    if (getResult.success) {
      expect(getResult.data.name).toBe('Test Favorites List');
      expect(getResult.data.description).toBe('Test favorites list description');
      expect(getResult.data.userId).toBe(favoritesList.userId);
      expect(getResult.data.color).toBe('#ff6b6b');
      expect(getResult.data.isDefault).toBe(false);
      expect(getResult.data.sortOrder).toBe(1);
    }

    await cleanUpFavoritesList();
  });

  it("즐겨찾기 목록 수정", async () => {
    const { favoritesList, cleanUpFavoritesList } = await createMockFavoritesList();

    const updateResult = await updateFavoritesList(favoritesList.id, { 
      name: '수정된 즐겨찾기 목록', 
      description: '수정된 설명입니다.',
      color: '#4ecdc4' 
    });
    expect(updateResult.success).toBe(true);
    if (updateResult.success) {
      expect(updateResult.data.name).toBe('수정된 즐겨찾기 목록');
      expect(updateResult.data.description).toBe('수정된 설명입니다.');
      expect(updateResult.data.color).toBe('#4ecdc4');
    }

    await cleanUpFavoritesList();
  });

  it("즐겨찾기 목록 삭제", async () => {
    const { favoritesList, cleanUpFavoritesList } = await createMockFavoritesList();

    const deleteResult = await deleteFavoritesList(favoritesList.id);
    expect(deleteResult.success).toBe(true);

    const getResult = await getFavoritesList(favoritesList.id);
    expect(getResult.success).toBe(false);

    await cleanUpFavoritesList(); // 이미 삭제되었지만 호출
  });

  it("사용자별 즐겨찾기 목록 조회", async () => {
    const { mockUser, cleanUpFavoritesList } = await createMockFavoritesList();
    const createdLists = [];

    for (let i = 1; i <= 2; i++) { // 기존 1개 + 새로 2개 = 총 3개
      const createResult = await createFavoritesList({
        userId: mockUser.id,
        name: `테스트 목록 ${i}`,
        description: `테스트 목록 ${i} 설명`,
        isDefault: false,
        sortOrder: i + 1,
        color: '#ff6b6b',
      });
      expect(createResult.success).toBe(true);
      if (createResult.success) {
        createdLists.push(createResult.data.id);
      }
    }

    const getUserListsResult = await getUserFavoritesLists(mockUser.id);
    expect(getUserListsResult.success).toBe(true);
    if (getUserListsResult.success) {
      expect(getUserListsResult.data.length).toBe(3); // 기존 1개 + 새로 2개
    }

    // Cleanup
    for (const listId of createdLists) {
      await deleteFavoritesList(listId);
    }
    await cleanUpFavoritesList();
  });

  it("기본 즐겨찾기 목록 생성 및 조회", async () => {
    // 실제 사용자 생성
    const { users, cleanUpUsers } = await createMockUsers({ count: 1 });
    const testUser = users[0];

    if (!testUser) {
      throw new Error('Failed to create test user');
    }

    const createDefaultResult = await createDefaultFavoritesList(testUser.id);
    expect(createDefaultResult.success).toBe(true);
    if (!createDefaultResult.success) {
      await cleanUpUsers();
      return;
    }

    expect(createDefaultResult.data.name).toBe('기본 즐겨찾기');
    expect(createDefaultResult.data.isDefault).toBe(true);
    expect(createDefaultResult.data.userId).toBe(testUser.id);

    const getDefaultResult = await getUserDefaultFavoritesList(testUser.id);
    expect(getDefaultResult.success).toBe(true);
    if (getDefaultResult.success) {
      expect(getDefaultResult.data.id).toBe(createDefaultResult.data.id);
    }

    // Cleanup
    await deleteFavoritesList(createDefaultResult.data.id);
    await cleanUpUsers();
  });

  it("즐겨찾기 목록 정렬 순서 업데이트", async () => {
    const { mockUser } = await createMockFavoritesList();
    const createdLists: { id: string; sortOrder: number }[] = [];

    for (let i = 1; i <= 3; i++) {
      const createResult = await createFavoritesList({
        userId: mockUser.id,
        name: `목록 ${i}`,
        description: `목록 ${i} 설명`,
        isDefault: false,
        sortOrder: i,
        color: '#ff6b6b',
      });
      expect(createResult.success).toBe(true);
      if (createResult.success) {
        createdLists.push({ id: createResult.data.id, sortOrder: 4 - i });
      }
    }

    const updateSortResult = await updateFavoritesListSortOrder(createdLists);
    expect(updateSortResult.success).toBe(true);

    for (const { id, sortOrder } of createdLists) {
      const getResult = await getFavoritesList(id);
      expect(getResult.success).toBe(true);
      if (getResult.success) {
        expect(getResult.data.sortOrder).toBe(sortOrder);
      }
    }

    // Cleanup
    for (const { id } of createdLists) {
      await deleteFavoritesList(id);
    }
  });

  it("존재하지 않는 즐겨찾기 목록 작업 처리", async () => {
    const nonExistentId = v4();

    const getResult = await getFavoritesList(nonExistentId);
    expect(getResult.success).toBe(false);
    if (!getResult.success) {
      expect(getResult.error.message).toBe("Favorites list not found");
    }

    const updateResult = await updateFavoritesList(nonExistentId, { name: '수정' });
    expect(updateResult.success).toBe(false);
    if (!updateResult.success) {
      expect(updateResult.error.message).toBe("Favorites list not found");
    }
  });

  it("빈 사용자 ID로 목록 조회", async () => {
    const emptyUserId = v4();

    const getUserListsResult = await getUserFavoritesLists(emptyUserId);
    expect(getUserListsResult.success).toBe(true);
    if (getUserListsResult.success) {
      expect(getUserListsResult.data.length).toBe(0);
    }
  });
}); 