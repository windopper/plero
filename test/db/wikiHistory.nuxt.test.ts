// @vitest-environment nuxt
import { afterAll, afterEach, describe, expect, it, test,  } from 'vitest';
import type { User, Wiki, WikiHistory } from '~/server/db/schema';
import { deleteWikiHistory, getWikiHistoriesByUserId, getWikiHistory, setWikiHistory, updateWikiHistory } from '~/server/db/wikiHistory';
import { v4 } from 'uuid';

describe("wiki history CRUD", () => {
    let createdDocumentIds: string[] = [];

    // Helper function for creating test data
    const createTestWikiHistory = () => {
        const testWikiId = v4();
        const testUserId = v4();
        
        const mockWiki: Omit<WikiHistory, 'id'> = {
            wikiId: testWikiId,
            title: 'test',
            content: 'test',
            changeMessage: 'test',
            changeType: 'edit',
            changedBy: testUserId,
            changedByName: 'test',
            changedByEmail: 'test@example.com',
            changedAt: Date.now(),
            previousVersion: null,
            parentVersions: [],
            contentSize: 4, // 'test'.length
            contentHash: 'test',
            isMinor: false,
            version: 1,
            tags: [],
            metadata: {},
            addedCharacters: 4,
            removedCharacters: 0,
            addedTags: [],
            removedTags: [],
        };

        return { testWikiId, testUserId, mockWiki };
    };

    // Helper function for cleanup
    const cleanupWikiHistory = async (documentId: string) => {
        try {
            await deleteWikiHistory(documentId);
        } catch (error) {
            console.warn('Failed to cleanup wiki history:', error);
        }
    };

    afterEach(async () => {
        // 각 테스트 후에 생성된 모든 문서를 정리
        for (const documentId of createdDocumentIds) {
            await cleanupWikiHistory(documentId);
        }
        createdDocumentIds = [];
    });

    it("위키 기록 생성 및 조회", async () => {
        const { testWikiId, mockWiki } = createTestWikiHistory();

        const setResult = await setWikiHistory(mockWiki);
        expect(setResult.success).toBe(true);
        
        if (!setResult.success) {
            throw new Error('Failed to set wiki history');
        }

        const documentId = setResult.data.id;
        const getResult = await getWikiHistory(documentId);
        createdDocumentIds.push(documentId);
        expect(getResult.success).toBe(true);
        if (getResult.success) {
            expect(getResult.data.title).toBe('test');
        }
    });

    it("유저 아이디로 위키 기록 조회", async () => {
        const { testWikiId, mockWiki, testUserId } = createTestWikiHistory();
        const setResult = await setWikiHistory(mockWiki);
        expect(setResult.success).toBe(true);
        if (!setResult.success) {
            throw new Error('Failed to set wiki history');
        }
        createdDocumentIds.push(setResult.data.id);

        const getResult = await getWikiHistoriesByUserId({ userId: testUserId, limit: 10, sort: 'desc' });
        expect(getResult.success).toBe(true);
        if (!getResult.success) {
            throw new Error('Failed to get wiki histories by user id');
        }
        expect(getResult.data.histories.length).toBe(1);
    });

    it("위키 기록 수정", async () => {
        const { testWikiId, mockWiki } = createTestWikiHistory();

        const setResult = await setWikiHistory(mockWiki);
        expect(setResult.success).toBe(true);
        if (!setResult.success) {
            throw new Error('Failed to set wiki history');
        }
        const documentId = setResult.data.id;
        createdDocumentIds.push(documentId);

        const updateResult = await updateWikiHistory(documentId, { changeMessage: 'updated' });
        expect(updateResult.success).toBe(true);
        if (updateResult.success && updateResult.data) {
            expect(updateResult.data.changeMessage).toBe('updated');
        }   
    });

    it("위키 기록 삭제", async () => {
        const { testWikiId, mockWiki } = createTestWikiHistory();

        // Create wiki history
        const setResult = await setWikiHistory(mockWiki);
        expect(setResult.success).toBe(true);
        
        if (!setResult.success) {
            throw new Error('Failed to set wiki history');
        }

        const documentId = setResult.data.id;
        createdDocumentIds.push(documentId);

        // Delete wiki history
        const deleteResult = await deleteWikiHistory(documentId);
        expect(deleteResult.success).toBe(true);

        // Verify deletion
        const getResult = await getWikiHistory(documentId);
        expect(getResult.success).toBe(false);
    });

    it("위키 기록 조회 실패 테스트", async () => {
        const { mockWiki } = createTestWikiHistory();
        const nonExistentId = v4();

        // Test get non-existent
        const getResult = await getWikiHistory(nonExistentId);
        expect(getResult.success).toBe(false);

        // Test update non-existent
        const updateResult = await updateWikiHistory(nonExistentId, mockWiki);
        expect(updateResult.success).toBe(false);

        // Test delete non-existent
        const deleteResult = await deleteWikiHistory(nonExistentId);
        expect(deleteResult.success).toBe(false);
    });
});
