// @vitest-environment nuxt
import { afterAll, describe, expect, it } from 'vitest';
import type { User, FavoritesList } from '~/server/db/schema';
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
import { getMockUser } from '../mock';

describe("즐겨찾기 목록 CRUD", () => {
    let createdDocumentIds: string[] = [];

    // Helper function for creating test data
    const createTestFavoritesList = () => {
        const testUserId = v4();
        
        const mockUser: User = getMockUser({
            id: testUserId,
        });

        const mockFavoritesList: Omit<FavoritesList, 'id' | 'createdAt' | 'updatedAt'> = {
            userId: testUserId,
            name: '테스트 즐겨찾기 목록',
            description: '테스트용 즐겨찾기 목록입니다.',
            color: '#ff6b6b',
            isDefault: false,
            sortOrder: 1,
        };

        return { testUserId, mockUser, mockFavoritesList };
    };

    const cleanupFavoritesList = async (listId: string) => {
        try {
            await deleteFavoritesList(listId);
        } catch (error) {
            console.warn('Failed to cleanup favorites list:', error);
        }
    };

    afterAll(async () => {
        for (const documentId of createdDocumentIds) {
            await cleanupFavoritesList(documentId);
        }
        createdDocumentIds = [];
    });

    it("즐겨찾기 목록 생성 및 조회", async () => {
        const { mockFavoritesList } = createTestFavoritesList();
        let listId: string | null = null;

        const createResult = await createFavoritesList(mockFavoritesList);
        expect(createResult.success).toBe(true);
        if (!createResult.success) {
            throw new Error('Failed to create favorites list');
        }
        listId = createResult.data.id;
        createdDocumentIds.push(listId);

        const getResult = await getFavoritesList(listId);
        expect(getResult.success).toBe(true);
        
        if (!getResult.success) {
            throw new Error('Failed to get favorites list');
        }
        
        expect(getResult.data.name).toBe(mockFavoritesList.name);
        expect(getResult.data.description).toBe(mockFavoritesList.description);
        expect(getResult.data.userId).toBe(mockFavoritesList.userId);
        expect(getResult.data.color).toBe(mockFavoritesList.color);
        expect(getResult.data.isDefault).toBe(mockFavoritesList.isDefault);
        expect(getResult.data.sortOrder).toBe(mockFavoritesList.sortOrder);
    });

    it("즐겨찾기 목록 수정", async () => {
        const { mockFavoritesList } = createTestFavoritesList();
        let listId: string | null = null;

        const createResult = await createFavoritesList(mockFavoritesList);
        expect(createResult.success).toBe(true);
        if (!createResult.success) {
            throw new Error('Failed to create favorites list');
        }
        listId = createResult.data.id;
        createdDocumentIds.push(listId);

        const updateResult = await updateFavoritesList(listId, { 
            name: '수정된 즐겨찾기 목록', 
            description: '수정된 설명입니다.',
            color: '#4ecdc4' 
        });
        expect(updateResult.success).toBe(true);
        if (!updateResult.success) {
            throw new Error('Failed to update favorites list');
        }
        expect(updateResult.data.name).toBe('수정된 즐겨찾기 목록');
        expect(updateResult.data.description).toBe('수정된 설명입니다.');
        expect(updateResult.data.color).toBe('#4ecdc4');
    });

    it("즐겨찾기 목록 삭제", async () => {
        const { mockFavoritesList } = createTestFavoritesList();
        let listId: string | null = null;

        const createResult = await createFavoritesList(mockFavoritesList);
        expect(createResult.success).toBe(true);
        if (!createResult.success) {
            throw new Error('Failed to create favorites list');
        }
        listId = createResult.data.id;
        createdDocumentIds.push(listId);

        const deleteResult = await deleteFavoritesList(listId);
        expect(deleteResult.success).toBe(true);

        // 삭제 후 조회 시 실패해야 함
        const getResult = await getFavoritesList(listId);
        expect(getResult.success).toBe(false);
    });

    it("사용자별 즐겨찾기 목록 조회", async () => {
        const { testUserId } = createTestFavoritesList();
        const createdLists: string[] = [];

        // 여러 목록 생성
        for (let i = 1; i <= 3; i++) {
            const createResult = await createFavoritesList({
                userId: testUserId,
                name: `테스트 목록 ${i}`,
                description: `테스트 목록 ${i} 설명`,
                isDefault: i === 1,
                sortOrder: i,
            });
            expect(createResult.success).toBe(true);
            if (createResult.success) {
                createdLists.push(createResult.data.id);
                createdDocumentIds.push(createResult.data.id);
            }
        }

        const getUserListsResult = await getUserFavoritesLists(testUserId);
        expect(getUserListsResult.success).toBe(true);
        if (!getUserListsResult.success) {
            throw new Error('Failed to get user favorites lists');
        }
        
        expect(getUserListsResult.data.length).toBe(3);
        expect(getUserListsResult.data[0].sortOrder).toBe(1); // 정렬 확인
        expect(getUserListsResult.data[1].sortOrder).toBe(2);
        expect(getUserListsResult.data[2].sortOrder).toBe(3);
    });

    it("기본 즐겨찾기 목록 생성 및 조회", async () => {
        const testUserId = v4();

        const createDefaultResult = await createDefaultFavoritesList(testUserId);
        expect(createDefaultResult.success).toBe(true);
        if (!createDefaultResult.success) {
            throw new Error('Failed to create default favorites list');
        }
        createdDocumentIds.push(createDefaultResult.data.id);

        expect(createDefaultResult.data.name).toBe('기본 즐겨찾기');
        expect(createDefaultResult.data.isDefault).toBe(true);
        expect(createDefaultResult.data.userId).toBe(testUserId);

        const getDefaultResult = await getUserDefaultFavoritesList(testUserId);
        expect(getDefaultResult.success).toBe(true);
        if (!getDefaultResult.success) {
            throw new Error('Failed to get default favorites list');
        }
        expect(getDefaultResult.data.id).toBe(createDefaultResult.data.id);
    });

    it("즐겨찾기 목록 정렬 순서 업데이트", async () => {
        const { testUserId } = createTestFavoritesList();
        const createdLists: { id: string; sortOrder: number }[] = [];

        // 3개 목록 생성
        for (let i = 1; i <= 3; i++) {
            const createResult = await createFavoritesList({
                userId: testUserId,
                name: `목록 ${i}`,
                description: `목록 ${i} 설명`,
                isDefault: false,
                sortOrder: i,
            });
            expect(createResult.success).toBe(true);
            if (createResult.success) {
                createdLists.push({ id: createResult.data.id, sortOrder: 4 - i }); // 역순으로 변경
                createdDocumentIds.push(createResult.data.id);
            }
        }

        // 정렬 순서 업데이트
        const updateSortResult = await updateFavoritesListSortOrder(createdLists);
        expect(updateSortResult.success).toBe(true);

        // 업데이트된 순서 확인
        for (const { id, sortOrder } of createdLists) {
            const getResult = await getFavoritesList(id);
            expect(getResult.success).toBe(true);
            if (getResult.success) {
                expect(getResult.data.sortOrder).toBe(sortOrder);
            }
        }
    });

    it("존재하지 않는 즐겨찾기 목록 작업 처리", async () => {
        const nonExistentId = v4();

        // 존재하지 않는 목록 조회
        const getResult = await getFavoritesList(nonExistentId);
        expect(getResult.success).toBe(false);
        if (!getResult.success) {
            expect(getResult.error.message).toBe("Favorites list not found");
        }

        // 존재하지 않는 목록 수정
        const updateResult = await updateFavoritesList(nonExistentId, { name: '수정' });
        expect(updateResult.success).toBe(false);
        if (!updateResult.success) {
            expect(updateResult.error.message).toBe("Favorites list not found");
        }
    });

    it("빈 사용자 ID로 목록 조회", async () => {
        const emptyUserId = v4(); // 존재하지 않는 사용자

        const getUserListsResult = await getUserFavoritesLists(emptyUserId);
        expect(getUserListsResult.success).toBe(true);
        if (getUserListsResult.success) {
            expect(getUserListsResult.data.length).toBe(0);
        }
    });
}); 