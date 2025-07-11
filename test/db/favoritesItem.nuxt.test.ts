// @vitest-environment nuxt
import { afterAll, describe, expect, it } from 'vitest';
import type { User, FavoritesList, FavoritesItem, Wiki } from '~/server/db/schema';
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
import { createFavoritesList, deleteFavoritesList } from '~/server/db/favoritesList';
import { setWiki, deleteWiki } from '~/server/db/wiki';
import { v4 } from 'uuid';
import { getMockUser } from '../mock';

describe("즐겨찾기 아이템 CRUD", () => {
    let createdDocumentIds: {
        items: string[];
        lists: string[];
        wikis: string[];
    } = {
        items: [],
        lists: [],
        wikis: []
    };

    // Helper function for creating test data
    const createTestData = async () => {
        const testUserId = v4();
        const testWikiId = v4();
        
        const mockUser: User = getMockUser({
            id: testUserId,
        });

        // 테스트용 위키 생성
        const mockWiki: Omit<Wiki, 'id'> = {
            title: '테스트 위키',
            content: '테스트 위키 내용',
            authorId: testUserId,
            authorName: mockUser.name,
            authorEmail: mockUser.email,
            lastEditor: testUserId,
            lastEditorName: mockUser.name,
            lastEditorEmail: mockUser.email,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            version: 1,
            latestVersion: 1,
            isPublished: true,
            tags: ['test'],
        };

        const wikiResult = await setWiki(mockWiki);
        if (!wikiResult.success) {
            throw new Error('Failed to create test wiki');
        }
        const wikiId = wikiResult.data.id;
        createdDocumentIds.wikis.push(wikiId);

        // 테스트용 즐겨찾기 목록 생성
        const listResult = await createFavoritesList({
            userId: testUserId,
            name: '테스트 즐겨찾기 목록',
            description: '테스트용 목록',
            isDefault: false,
            sortOrder: 1,
        });
        
        if (!listResult.success) {
            throw new Error('Failed to create test favorites list');
        }
        const listId = listResult.data.id;
        createdDocumentIds.lists.push(listId);

        return { testUserId, wikiId, listId, mockUser };
    };

    const cleanupItems = async () => {
        // 클린업은 역순으로 (items -> lists -> wikis)
        for (const listId of createdDocumentIds.lists) {
            try {
                await removeAllItemsFromList(listId);
                await deleteFavoritesList(listId);
            } catch (error) {
                console.warn('Failed to cleanup favorites list:', error);
            }
        }
        
        for (const wikiId of createdDocumentIds.wikis) {
            try {
                await deleteWiki(wikiId);
            } catch (error) {
                console.warn('Failed to cleanup wiki:', error);
            }
        }
    };

    afterAll(async () => {
        await cleanupItems();
        createdDocumentIds = { items: [], lists: [], wikis: [] };
    });

    it("즐겨찾기에 위키 추가 및 조회", async () => {
        const { testUserId, wikiId, listId } = await createTestData();

        const addResult = await addToFavorites({
            userId: testUserId,
            wikiId,
            listId,
            note: '테스트 메모'
        });
        
        expect(addResult.success).toBe(true);
        if (!addResult.success) {
            throw new Error('Failed to add to favorites');
        }
        
        createdDocumentIds.items.push(addResult.data.id);
        
        expect(addResult.data.userId).toBe(testUserId);
        expect(addResult.data.wikiId).toBe(wikiId);
        expect(addResult.data.listId).toBe(listId);
        expect(addResult.data.note).toBe('테스트 메모');

        // 조회 테스트
        const getResult = await getFavoritesItem(addResult.data.id);
        expect(getResult.success).toBe(true);
        if (getResult.success) {
            expect(getResult.data.id).toBe(addResult.data.id);
        }
    });

    it("중복 즐겨찾기 추가 방지", async () => {
        const { testUserId, wikiId, listId } = await createTestData();

        // 첫 번째 추가
        const firstAddResult = await addToFavorites({
            userId: testUserId,
            wikiId,
            listId,
        });
        expect(firstAddResult.success).toBe(true);
        if (firstAddResult.success) {
            createdDocumentIds.items.push(firstAddResult.data.id);
        }

        // 중복 추가 시도
        const duplicateAddResult = await addToFavorites({
            userId: testUserId,
            wikiId,
            listId,
        });
        expect(duplicateAddResult.success).toBe(false);
        if (!duplicateAddResult.success) {
            expect(duplicateAddResult.error.message).toBe("Already added to this favorites list");
        }
    });

    it("즐겨찾기에서 위키 제거", async () => {
        const { testUserId, wikiId, listId } = await createTestData();

        // 먼저 추가
        const addResult = await addToFavorites({
            userId: testUserId,
            wikiId,
            listId,
        });
        expect(addResult.success).toBe(true);
        if (addResult.success) {
            createdDocumentIds.items.push(addResult.data.id);
        }

        // 제거
        const removeResult = await removeFromFavorites(wikiId, listId);
        expect(removeResult.success).toBe(true);

        // 제거 후 조회 시 실패해야 함
        const getResult = await getFavoritesItemByWikiAndList(wikiId, listId);
        expect(getResult.success).toBe(false);
    });

    it("즐겨찾기 아이템 수정", async () => {
        const { testUserId, wikiId, listId } = await createTestData();

        const addResult = await addToFavorites({
            userId: testUserId,
            wikiId,
            listId,
            note: '원본 메모'
        });
        expect(addResult.success).toBe(true);
        if (!addResult.success) {
            throw new Error('Failed to add to favorites');
        }
        createdDocumentIds.items.push(addResult.data.id);

        const updateResult = await updateFavoritesItem(addResult.data.id, {
            note: '수정된 메모'
        });
        expect(updateResult.success).toBe(true);
        if (updateResult.success) {
            expect(updateResult.data.note).toBe('수정된 메모');
        }
    });

    it("목록별 즐겨찾기 아이템 조회", async () => {
        const { testUserId, listId } = await createTestData();
        
        // 여러 위키를 같은 목록에 추가
        const wikiIds: string[] = [];
        for (let i = 0; i < 3; i++) {
            const { wikiId } = await createTestData();
            wikiIds.push(wikiId);
            
            const addResult = await addToFavorites({
                userId: testUserId,
                wikiId,
                listId,
                note: `메모 ${i + 1}`
            });
            expect(addResult.success).toBe(true);
            if (addResult.success) {
                createdDocumentIds.items.push(addResult.data.id);
            }
        }

        const getItemsResult = await getFavoritesItemsByList(listId);
        expect(getItemsResult.success).toBe(true);
        if (getItemsResult.success) {
            expect(getItemsResult.data.length).toBeGreaterThanOrEqual(3);
        }
    });

    it("사용자별 즐겨찾기 아이템 조회", async () => {
        const { testUserId, wikiId, listId } = await createTestData();

        const addResult = await addToFavorites({
            userId: testUserId,
            wikiId,
            listId,
        });
        expect(addResult.success).toBe(true);
        if (addResult.success) {
            createdDocumentIds.items.push(addResult.data.id);
        }

        const getUserItemsResult = await getUserFavoritesItems(testUserId);
        expect(getUserItemsResult.success).toBe(true);
        if (getUserItemsResult.success) {
            expect(getUserItemsResult.data.length).toBeGreaterThanOrEqual(1);
            expect(getUserItemsResult.data.some(item => item.wikiId === wikiId)).toBe(true);
        }
    });

    it("위키별 즐겨찾기 아이템 조회", async () => {
        const { testUserId, wikiId, listId } = await createTestData();

        const addResult = await addToFavorites({
            userId: testUserId,
            wikiId,
            listId,
        });
        expect(addResult.success).toBe(true);
        if (addResult.success) {
            createdDocumentIds.items.push(addResult.data.id);
        }

        const getWikiItemsResult = await getFavoritesItemsByWiki(wikiId);
        expect(getWikiItemsResult.success).toBe(true);
        if (getWikiItemsResult.success) {
            expect(getWikiItemsResult.data.length).toBeGreaterThanOrEqual(1);
            expect(getWikiItemsResult.data[0].wikiId).toBe(wikiId);
        }
    });

    it("사용자의 위키 즐겨찾기 여부 확인", async () => {
        const { testUserId, wikiId, listId } = await createTestData();

        // 즐겨찾기 추가 전
        const isFavoritedBefore = await isWikiFavoritedByUser(testUserId, wikiId);
        expect(isFavoritedBefore.success).toBe(true);
        if (isFavoritedBefore.success) {
            expect(isFavoritedBefore.data).toBe(false);
        }

        // 즐겨찾기 추가
        const addResult = await addToFavorites({
            userId: testUserId,
            wikiId,
            listId,
        });
        expect(addResult.success).toBe(true);
        if (addResult.success) {
            createdDocumentIds.items.push(addResult.data.id);
        }

        // 즐겨찾기 추가 후
        const isFavoritedAfter = await isWikiFavoritedByUser(testUserId, wikiId);
        expect(isFavoritedAfter.success).toBe(true);
        if (isFavoritedAfter.success) {
            expect(isFavoritedAfter.data).toBe(true);
        }
    });

    it("위키의 총 즐겨찾기 수 계산", async () => {
        const { testUserId, wikiId, listId } = await createTestData();

        // 즐겨찾기 추가 전
        const countBefore = await getWikiFavoritesCount(wikiId);
        expect(countBefore.success).toBe(true);
        if (countBefore.success) {
            expect(countBefore.data).toBe(0);
        }

        // 즐겨찾기 추가
        const addResult = await addToFavorites({
            userId: testUserId,
            wikiId,
            listId,
        });
        expect(addResult.success).toBe(true);
        if (addResult.success) {
            createdDocumentIds.items.push(addResult.data.id);
        }

        // 즐겨찾기 추가 후
        const countAfter = await getWikiFavoritesCount(wikiId);
        expect(countAfter.success).toBe(true);
        if (countAfter.success) {
            expect(countAfter.data).toBe(1);
        }
    });

    it("목록의 모든 아이템 제거", async () => {
        const { testUserId, wikiId, listId } = await createTestData();

        // 아이템 추가
        const addResult = await addToFavorites({
            userId: testUserId,
            wikiId,
            listId,
        });
        expect(addResult.success).toBe(true);
        if (addResult.success) {
            createdDocumentIds.items.push(addResult.data.id);
        }

        // 목록의 모든 아이템 제거
        const removeAllResult = await removeAllItemsFromList(listId);
        expect(removeAllResult.success).toBe(true);

        // 목록에 아이템이 없는지 확인
        const getItemsResult = await getFavoritesItemsByList(listId);
        expect(getItemsResult.success).toBe(true);
        if (getItemsResult.success) {
            expect(getItemsResult.data.length).toBe(0);
        }
    });

    it("존재하지 않는 아이템 작업 처리", async () => {
        const nonExistentId = v4();
        const nonExistentWikiId = v4();
        const nonExistentListId = v4();

        // 존재하지 않는 아이템 조회
        const getResult = await getFavoritesItem(nonExistentId);
        expect(getResult.success).toBe(false);
        if (!getResult.success) {
            expect(getResult.error.message).toBe("Favorites item not found");
        }

        // 존재하지 않는 아이템 제거
        const removeResult = await removeFromFavorites(nonExistentWikiId, nonExistentListId);
        expect(removeResult.success).toBe(false);
        if (!removeResult.success) {
            expect(removeResult.error.message).toBe("Item not found in favorites list");
        }

        // 존재하지 않는 아이템 수정
        const updateResult = await updateFavoritesItem(nonExistentId, { note: '수정' });
        expect(updateResult.success).toBe(false);
        if (!updateResult.success) {
            expect(updateResult.error.message).toBe("Favorites item not found");
        }
    });
}); 