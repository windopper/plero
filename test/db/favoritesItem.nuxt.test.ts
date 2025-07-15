// @vitest-environment nuxt
import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { createMockWiki, createMockFavoritesList } from '../mock';
import { 
  getFavoritesItem,
  addToFavorites, 
  removeFromFavorites, 
  updateFavoritesItem,
  getFavoritesItemByWikiAndList,
  getFavoritesItemsByList,
  getUserFavoritesItems,
  getFavoritesItemsByWiki,
  isWikiFavoritedByUser,
  getWikiFavoritesCount,
  removeAllItemsFromList
} from '~/server/db/favoritesItem';
import { v4 } from 'uuid';

describe("Favorites Item DB Integration Tests", () => {
  let createdItems: string[] = [];

  afterEach(async () => {
    // 각 테스트 후 cleanup if needed
  });

  afterAll(async () => {
    // 전역 cleanup은 각 테스트의 cleanUp 함수에서 처리
  });

  it("즐겨찾기에 위키 추가 및 조회", async () => {
    const { wiki, cleanUpWiki } = await createMockWiki();
    const { favoritesList, mockUser, cleanUpFavoritesList } = await createMockFavoritesList();

    const addResult = await addToFavorites({
      userId: mockUser.id,
      wikiId: wiki.id,
      listId: favoritesList.id,
      note: '테스트 메모'
    });
    
    expect(addResult.success).toBe(true);
    if (addResult.success) {
      expect(addResult.data.userId).toBe(mockUser.id);
      expect(addResult.data.wikiId).toBe(wiki.id);
      expect(addResult.data.listId).toBe(favoritesList.id);
      expect(addResult.data.note).toBe('테스트 메모');

      const getResult = await getFavoritesItem(addResult.data.id);
      expect(getResult.success).toBe(true);
      if (getResult.success) {
        expect(getResult.data.id).toBe(addResult.data.id);
      }
    }

    await cleanUpFavoritesList();
    await cleanUpWiki();
  });

  it("중복 즐겨찾기 추가 방지", async () => {
    const { wiki, cleanUpWiki } = await createMockWiki();
    const { favoritesList, mockUser, cleanUpFavoritesList } = await createMockFavoritesList();

    const firstAddResult = await addToFavorites({
      userId: mockUser.id,
      wikiId: wiki.id,
      listId: favoritesList.id,
      note: ''
    });
    expect(firstAddResult.success).toBe(true);

    const duplicateAddResult = await addToFavorites({
      userId: mockUser.id,
      wikiId: wiki.id,
      listId: favoritesList.id,
      note: ''
    });
    expect(duplicateAddResult.success).toBe(false);
    if (!duplicateAddResult.success) {
      expect(duplicateAddResult.error.message).toBe("Already added to this favorites list");
    }

    await cleanUpFavoritesList();
    await cleanUpWiki();
  });

  it("즐겨찾기에서 위키 제거", async () => {
    const { wiki, cleanUpWiki } = await createMockWiki();
    const { favoritesList, mockUser, cleanUpFavoritesList } = await createMockFavoritesList();

    const addResult = await addToFavorites({
      userId: mockUser.id,
      wikiId: wiki.id,
      listId: favoritesList.id,
      note: ''
    });
    expect(addResult.success).toBe(true);

    const removeResult = await removeFromFavorites(wiki.id, favoritesList.id);
    expect(removeResult.success).toBe(true);

    const getResult = await getFavoritesItemByWikiAndList(wiki.id, favoritesList.id);
    expect(getResult.success).toBe(false);

    await cleanUpFavoritesList();
    await cleanUpWiki();
  });

  it("즐겨찾기 아이템 수정", async () => {
    const { wiki, cleanUpWiki } = await createMockWiki();
    const { favoritesList, mockUser, cleanUpFavoritesList } = await createMockFavoritesList();

    const addResult = await addToFavorites({
      userId: mockUser.id,
      wikiId: wiki.id,
      listId: favoritesList.id,
      note: '원본 메모'
    });
    expect(addResult.success).toBe(true);
    if (!addResult.success) {
      await cleanUpFavoritesList();
      await cleanUpWiki();
      return;
    }

    const updateResult = await updateFavoritesItem(addResult.data.id, {
      note: '수정된 메모'
    });
    expect(updateResult.success).toBe(true);
    if (updateResult.success) {
      expect(updateResult.data.note).toBe('수정된 메모');
    }

    await cleanUpFavoritesList();
    await cleanUpWiki();
  });

  it("목록별 즐겨찾기 아이템 조회", async () => {
    const { favoritesList, mockUser, cleanUpFavoritesList } = await createMockFavoritesList();
    const wikis = [];
    
    for (let i = 0; i < 3; i++) {
      const { wiki, cleanUpWiki } = await createMockWiki({ title: `Test Wiki ${i}` });
      wikis.push({ wiki, cleanUpWiki });
      
      const addResult = await addToFavorites({
        userId: mockUser.id,
        wikiId: wiki.id,
        listId: favoritesList.id,
        note: `메모 ${i + 1}`
      });
      expect(addResult.success).toBe(true);
    }

    const getItemsResult = await getFavoritesItemsByList(favoritesList.id);
    expect(getItemsResult.success).toBe(true);
    if (getItemsResult.success) {
      expect(getItemsResult.data.length).toBe(3);
    }

    // Cleanup
    await cleanUpFavoritesList();
    for (const { cleanUpWiki } of wikis) {
      await cleanUpWiki();
    }
  });

  it("사용자별 즐겨찾기 아이템 조회", async () => {
    const { wiki, cleanUpWiki } = await createMockWiki();
    const { favoritesList, mockUser, cleanUpFavoritesList } = await createMockFavoritesList();

    const addResult = await addToFavorites({
      userId: mockUser.id,
      wikiId: wiki.id,
      listId: favoritesList.id,
      note: ''
    });
    expect(addResult.success).toBe(true);

    const getUserItemsResult = await getUserFavoritesItems(mockUser.id);
    expect(getUserItemsResult.success).toBe(true);
    if (getUserItemsResult.success) {
      expect(getUserItemsResult.data.length).toBeGreaterThanOrEqual(1);
      expect(getUserItemsResult.data.some(item => item.wikiId === wiki.id)).toBe(true);
    }

    await cleanUpFavoritesList();
    await cleanUpWiki();
  });

  it("위키별 즐겨찾기 아이템 조회", async () => {
    const { wiki, cleanUpWiki } = await createMockWiki();
    const { favoritesList, mockUser, cleanUpFavoritesList } = await createMockFavoritesList();

    const addResult = await addToFavorites({
      userId: mockUser.id,
      wikiId: wiki.id,
      listId: favoritesList.id,
      note: ''
    });
    expect(addResult.success).toBe(true);

    const getWikiItemsResult = await getFavoritesItemsByWiki(wiki.id);
    expect(getWikiItemsResult.success).toBe(true);
    if (getWikiItemsResult.success) {
      expect(getWikiItemsResult.data.length).toBeGreaterThanOrEqual(1);
      expect(getWikiItemsResult.data[0].wikiId).toBe(wiki.id);
    }

    await cleanUpFavoritesList();
    await cleanUpWiki();
  });

  it("사용자의 위키 즐겨찾기 여부 확인", async () => {
    const { wiki, cleanUpWiki } = await createMockWiki();
    const { favoritesList, mockUser, cleanUpFavoritesList } = await createMockFavoritesList();

    const isFavoritedBefore = await isWikiFavoritedByUser(mockUser.id, wiki.id);
    expect(isFavoritedBefore.success).toBe(true);
    if (isFavoritedBefore.success) {
      expect(isFavoritedBefore.data).toBe(false);
    }

    const addResult = await addToFavorites({
      userId: mockUser.id,
      wikiId: wiki.id,
      listId: favoritesList.id,
      note: ''
    });
    expect(addResult.success).toBe(true);

    const isFavoritedAfter = await isWikiFavoritedByUser(mockUser.id, wiki.id);
    expect(isFavoritedAfter.success).toBe(true);
    if (isFavoritedAfter.success) {
      expect(isFavoritedAfter.data).toBe(true);
    }

    await cleanUpFavoritesList();
    await cleanUpWiki();
  });

  it("위키의 총 즐겨찾기 수 계산", async () => {
    const { wiki, cleanUpWiki } = await createMockWiki();
    const { favoritesList, mockUser, cleanUpFavoritesList } = await createMockFavoritesList();

    const countBefore = await getWikiFavoritesCount(wiki.id);
    expect(countBefore.success).toBe(true);
    if (countBefore.success) {
      expect(countBefore.data).toBe(0);
    }

    const addResult = await addToFavorites({
      userId: mockUser.id,
      wikiId: wiki.id,
      listId: favoritesList.id,
      note: ''
    });
    expect(addResult.success).toBe(true);

    const countAfter = await getWikiFavoritesCount(wiki.id);
    expect(countAfter.success).toBe(true);
    if (countAfter.success) {
      expect(countAfter.data).toBe(1);
    }

    await cleanUpFavoritesList();
    await cleanUpWiki();
  });

  it("목록의 모든 아이템 제거", async () => {
    const { wiki, cleanUpWiki } = await createMockWiki();
    const { favoritesList, mockUser, cleanUpFavoritesList } = await createMockFavoritesList();

    const addResult = await addToFavorites({
      userId: mockUser.id,
      wikiId: wiki.id,
      listId: favoritesList.id,
      note: ''
    });
    expect(addResult.success).toBe(true);

    const removeAllResult = await removeAllItemsFromList(favoritesList.id);
    expect(removeAllResult.success).toBe(true);

    const getItemsResult = await getFavoritesItemsByList(favoritesList.id);
    expect(getItemsResult.success).toBe(true);
    if (getItemsResult.success) {
      expect(getItemsResult.data.length).toBe(0);
    }

    await cleanUpFavoritesList();
    await cleanUpWiki();
  });

  it("존재하지 않는 아이템 작업 처리", async () => {
    const nonExistentId = v4();
    const nonExistentWikiId = v4();
    const nonExistentListId = v4();

    const getResult = await getFavoritesItem(nonExistentId);
    expect(getResult.success).toBe(false);
    if (!getResult.success) {
      expect(getResult.error.message).toBe("Favorites item not found");
    }

    const removeResult = await removeFromFavorites(nonExistentWikiId, nonExistentListId);
    expect(removeResult.success).toBe(false);
    if (!removeResult.success) {
      expect(removeResult.error.message).toBe("Item not found in favorites list");
    }

    const updateResult = await updateFavoritesItem(nonExistentId, { note: '수정' });
    expect(updateResult.success).toBe(false);
    if (!updateResult.success) {
      expect(updateResult.error.message).toBe("Favorites item not found");
    }
  });
}); 