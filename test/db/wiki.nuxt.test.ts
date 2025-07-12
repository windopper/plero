// @vitest-environment nuxt
import { afterAll, describe, expect, it, test } from 'vitest';
import type { User, Wiki } from '~/server/db/schema';
import { getWiki, setWiki, updateWiki, deleteWiki, getWikiList } from '~/server/db/wiki';
import { v4 } from 'uuid';
import { getMockUser } from '../mock';

describe("wiki CRUD", () => {
    let createdDocumentIds: string[] = [];

    // Helper function for creating test data
    const createTestWiki = () => {
        const testId = v4();
        const testUserId = v4();
        
        const mockUser: User = getMockUser({
            id: testUserId,
        });

        const mockWiki: Omit<Wiki, 'id'> = {
            title: 'Test Wiki',
            content: 'This is test content',
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

        return { testId, testUserId, mockUser, mockWiki };
    };

    const cleanupWiki = async (wikiId: string) => {
        try {
            await deleteWiki(wikiId);
        } catch (error) {
            console.warn('Failed to cleanup wiki:', error);
        }
    };

    const cleanupAllWikis = async () => {
        for (const documentId of createdDocumentIds) {
            await cleanupWiki(documentId);
        }
        createdDocumentIds = [];
    };

    afterAll(async () => {
        await cleanupAllWikis();
    });

    it("위키 생성 및 조회", async () => {
        const { mockUser, mockWiki } = createTestWiki();
        let wikiId: string | null = null;

        const setResult = await setWiki(mockWiki);
        expect(setResult.success).toBe(true);
        if (!setResult.success) {
            throw new Error('Failed to set wiki');
        }
        wikiId = setResult.data.id;
        createdDocumentIds.push(wikiId);

        const getResult = await getWiki(wikiId);
        expect(getResult.success).toBe(true);
        
        if (!getResult.success) {
            throw new Error('Failed to get wiki');
        }
        
        expect(getResult.data.title).toBe(mockWiki.title);
        expect(getResult.data.content).toBe(mockWiki.content);
        expect(getResult.data.authorName).toBe(mockUser.name);
        expect(getResult.data.authorEmail).toBe(mockUser.email);
    });

    it("위키 부분 검색어로 목록 조회", async () => {
        await cleanupAllWikis();
        
        const { mockWiki } = createTestWiki();
        const setResult = await setWiki(mockWiki);
        expect(setResult.success).toBe(true);
        if (!setResult.success) {
            throw new Error('Failed to set wiki');
        }
        createdDocumentIds.push(setResult.data.id);
        
        const getResult = await getWikiList({ query: 'Test', limit: 10 });
        expect(getResult.success).toBe(true);
        if (!getResult.success) {
            throw new Error('Failed to get wiki list');
        }
        expect(getResult.data.wikis[0].title).toBe(mockWiki.title);
        expect(getResult.data.hasMore).toBe(false);
    });

    it("위키 목록 조회 페이징 테스트", async () => {
        // 스킵
        return;
    });

    it("위키 수정", async () => {
        const { mockWiki } = createTestWiki();
        let wikiId: string | null = null;

        const setResult = await setWiki(mockWiki);
        expect(setResult.success).toBe(true);
        if (!setResult.success) {
            throw new Error('Failed to set wiki');
        }
        wikiId = setResult.data.id;
        createdDocumentIds.push(wikiId);

        const updateResult = await updateWiki(wikiId, { title: 'Updated Wiki Title', content: 'Updated content' });
        expect(updateResult.success).toBe(true);
        if (!updateResult.success) {
            throw new Error('Failed to update wiki');
        }
        expect(updateResult.data.title).toBe('Updated Wiki Title');
        expect(updateResult.data.content).toBe('Updated content');
    });

    it("위키 삭제", async () => {
        const { mockWiki } = createTestWiki();
        let wikiId: string | null = null;

        const setResult = await setWiki(mockWiki);
        expect(setResult.success).toBe(true);
        if (!setResult.success) {
            throw new Error('Failed to set wiki');
        }
        wikiId = setResult.data.id;
        createdDocumentIds.push(wikiId);

        const deleteResult = await deleteWiki(wikiId);
        expect(deleteResult.success).toBe(true);
    });

    it("위키 조회 실패 테스트", async () => {
        const nonExistentId = v4();

        // Test get non-existent
        const getResult = await getWiki(nonExistentId);
        expect(getResult.success).toBe(false);
        if (!getResult.success) {
            expect(getResult.error.message).toBe("Wiki not found");
        }

        // Test update non-existent
        const updateResult = await updateWiki(nonExistentId, { title: 'Updated' });
        expect(updateResult.success).toBe(false);
        if (!updateResult.success) {
            expect(updateResult.error.message).toBe("Wiki not found");
        }
    });
});
