// @vitest-environment nuxt
import { describe, expect, it, afterEach } from "vitest";
import { v4 } from "uuid";
import type { User, Wiki, WikiContributor } from "~/server/db/schema";
import { deleteWikiContributor, getWikiContributor, setWikiContributor, updateWikiContributor } from "~/server/db/wikiContributor";
import { getMockUser } from "../mock";

describe("wiki contributor CRUD", () => {
    let createdDocumentIds: string[] = [];

    const createTestWikiContributor = () => {
        const testWikiId = v4();
        const testUserId = v4();

        const mockUser: User = getMockUser({
            id: testUserId,
        });

        const mockWikiContributor: Omit<WikiContributor, 'id'> = {
            wikiId: testWikiId,
            contributorId: testUserId,
            contributorName: mockUser.name,
            contributorEmail: mockUser.email,
            contributedAt: Date.now(),
            linesAdded: 0,
            linesRemoved: 0,
        }

        return { testWikiId, testUserId, mockUser, mockWikiContributor };
    }

    const cleanupWikiContributor = async (documentId: string) => {
        try {
            await deleteWikiContributor(documentId);
        } catch (error) {
            console.warn('Failed to cleanup wiki contributor:', error);
        }
    }

    afterEach(async () => {
        // 각 테스트 후에 생성된 모든 문서를 정리
        for (const documentId of createdDocumentIds) {
            await cleanupWikiContributor(documentId);
        }
        createdDocumentIds = [];
    });

    it("should create and get wiki contributor", async () => {
        const { mockWikiContributor } = createTestWikiContributor();
        const testStartTime = Date.now();

        const setResult = await setWikiContributor(mockWikiContributor);
        expect(setResult.success).toBe(true);
        if (setResult.success && setResult.data) {
            createdDocumentIds.push(setResult.data.id);
            expect(setResult.data.contributorId).toBe(mockWikiContributor.contributorId);
            expect(setResult.data.contributorEmail).toBe(mockWikiContributor.contributorEmail);
            expect(setResult.data.contributorName).toBe(mockWikiContributor.contributorName);
            expect(setResult.data.contributedAt).toBeGreaterThanOrEqual(testStartTime);
            expect(setResult.data.linesAdded).toBe(0);
            expect(setResult.data.linesRemoved).toBe(0);
        }
    });

    it("should update wiki contributor", async () => {
        const { mockWikiContributor } = createTestWikiContributor();

        const setResult = await setWikiContributor(mockWikiContributor);
        expect(setResult.success).toBe(true);
        if (setResult.success && setResult.data) {
            const documentId = setResult.data.id;
            createdDocumentIds.push(documentId);
            
            const updateResult = await updateWikiContributor(documentId, { linesAdded: 1, linesRemoved: 0 });
            expect(updateResult.success).toBe(true);
            if (updateResult.success && updateResult.data) {
                expect(updateResult.data.linesAdded).toBe(1);
                expect(updateResult.data.linesRemoved).toBe(0);
            }
        }
    });

    it("should delete wiki contributor", async () => {
        const { mockWikiContributor } = createTestWikiContributor();

        const setResult = await setWikiContributor(mockWikiContributor);
        expect(setResult.success).toBe(true);
        if (setResult.success && setResult.data) {
            const documentId = setResult.data.id;
            
            const deleteResult = await deleteWikiContributor(documentId);
            expect(deleteResult.success).toBe(true);
            
            const getResult = await getWikiContributor(documentId);
            expect(getResult.success).toBe(false);
        }
    });
});