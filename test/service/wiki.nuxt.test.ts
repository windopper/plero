import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getTestUser } from '../../server/utils/testAuth'
import { _permanantDeleteWikiService, createWikiService, deleteWikiService, revertWikiService, updateWikiService } from "~/server/service/wiki";
import { getWiki } from "~/server/db/wiki";
import type { User } from "~/server/db/schema";

describe("wiki service", () => {
    const shouldDeleteWikiList: string[] = [
        "d8a52a28-e1ce-452e-aac3-436a558cb019",
        "31577739-9626-4d54-966e-44776fa9d7a0",
    ];

    const createTestWiki = ({ title, content, tags = [], author = getTestUser() }: {
        title: string,
        content: string,
        tags: string[],
        author?: User,
    }) => { 
        const wiki = {
            title,
            content,
            tags: [],
            author,
        }
        return wiki;
    }
    

    afterAll(async () => {
        for (const wikiId of shouldDeleteWikiList) {
            await _permanantDeleteWikiService(wikiId);
        }
    });

    it("위키 생성", async () => {
        const wiki = await createWikiService(createTestWiki({ title: "test", content: "test", tags: [] }));
        if (!wiki.success) {
            throw new Error("Failed to create wiki");
        }
        shouldDeleteWikiList.push(wiki.data.wiki.id);

        const getWikiResult = await getWiki(wiki.data.wiki.id);
        expect(getWikiResult.success).toBe(true);
    })

    it("위키 수정", async () => {
        const user = getTestUser();
        const wiki = await createWikiService({
            title: "test",
            content: "test",
            tags: [],
            author: user,
        });
        if (!wiki.success) {
            throw new Error("Failed to create wiki");
        }
        shouldDeleteWikiList.push(wiki.data.wiki.id);

        expect(wiki.data.contributor.linesAdded).toBe(4);
        expect(wiki.data.contributor.linesRemoved).toBe(0);

        const wiki2 = await updateWikiService(wiki.data.wiki.id, {
            title: "test2", 
            content: "test2",
            updateMessage: "test2",
            author: user,
            tags: [],
        });
        if (!wiki2.success) {
            throw new Error("Failed to update wiki");
        }   

        const getWikiResult = await getWiki(wiki.data.wiki.id);
        if (!getWikiResult.success) {
            throw new Error("Failed to get wiki");
        }

        expect(getWikiResult.data.title).toBe("test2");
        expect(getWikiResult.data.content).toBe("test2");
        expect(getWikiResult.data.version).toBe(2);
    })

    it("위키 태그 수정", async () => {
        const user = getTestUser();
        const wiki = await createWikiService(
          createTestWiki({
            title: "test",
            content: "test",
            tags: [],
            author: user,
          })
        );
        if (!wiki.success) {
            throw new Error("Failed to create wiki");
        }
        shouldDeleteWikiList.push(wiki.data.wiki.id);

        const wiki2 = await updateWikiService(wiki.data.wiki.id, {
            title: "test2",
            content: "test2",
            updateMessage: "test2",
            author: user,
            tags: ["test"],
        });
        if (!wiki2.success) {
            throw new Error("Failed to update wiki");
        }

        expect(wiki2.data.wiki.tags).toEqual(["test"]);
        expect(wiki2.data.history.addedTags).toEqual(["test"]);
        expect(wiki2.data.history.removedTags).toEqual([]);

        const wiki3 = await updateWikiService(wiki2.data.wiki.id, {
            title: "test3",
            content: "test3",
            updateMessage: "test3",
            author: user,
            tags: ["test2"],
        });

        expect(wiki3.success).toBe(true);
        if (!wiki3.success) {
            throw new Error("Failed to update wiki");
        }

        expect(wiki3.data.wiki.tags).toEqual(["test2"]);
        expect(wiki3.data.history.addedTags).toEqual(["test2"]);
        expect(wiki3.data.history.removedTags).toEqual(["test"]);
    })

    it("위키 삭제", async () => {
        const user = getTestUser();
        const wiki = await createWikiService(
          createTestWiki({
            title: "test",
            content: "test",
            tags: [],
            author: user,
          })
        );
        if (!wiki.success) {
            throw new Error("Failed to create wiki");
        }
        shouldDeleteWikiList.push(wiki.data.wiki.id);

        const deleteWikiResult = await deleteWikiService(wiki.data.wiki.id, {
            deleteMessage: "test",
            author: user,
        });
        if (!deleteWikiResult.success) {
            throw new Error("Failed to delete wiki");
        }

        const getWikiResult = await getWiki(wiki.data.wiki.id);
        if (!getWikiResult.success) {
            throw new Error("Failed to get wiki");
        }

        expect(getWikiResult.data.title).toBe("test");
        expect(getWikiResult.data.content).toBe("");
        expect(getWikiResult.data.version).toBe(2);
    })

    it("특정 시점으로 위키 되돌리기", async () => {
        const user = getTestUser();

        const wiki = await createWikiService(
          createTestWiki({
            title: "test",
            content: "test",
            tags: [],
            author: user,
          })
        );
        if (!wiki.success) {
            throw new Error("Failed to create wiki");
        }
        shouldDeleteWikiList.push(wiki.data.wiki.id);

        const wiki2 = await updateWikiService(wiki.data.wiki.id, {
            title: "test2",
            content: "test2",
            updateMessage: "test2",
            author: user,
            tags: [],
        });
        if (!wiki2.success) {
            throw new Error("Failed to update wiki");
        }

        const revert = await revertWikiService({
            author: user,
            revertHistoryId: wiki.data.history.id
        });
        if (!revert.success) {
            throw new Error("Failed to revert wiki");
        }

        const getWikiResult = await getWiki(wiki.data.wiki.id);
        if (!getWikiResult.success) {
            throw new Error("Failed to get wiki");
        }

        expect(getWikiResult.data.title).toBe("test");
        expect(getWikiResult.data.content).toBe("test");
        expect(getWikiResult.data.version).toBe(1);
        expect(getWikiResult.data.latestVersion).toBe(2);
    });

    it("위키 여러번 기여 후 통계 확인", async () => {
        const user = getTestUser();

        const wiki = await createWikiService(createTestWiki({
            title: "test",
            content: "test",
            tags: [],
            author: user,
          })
        );
        if (!wiki.success) {
            throw new Error("Failed to create wiki");
        }
        shouldDeleteWikiList.push(wiki.data.wiki.id);

        const wiki2 = await updateWikiService(wiki.data.wiki.id, {
            title: "test2",
            content: "test2",
            updateMessage: "test2",
            author: user,
            tags: [],
        });
        if (!wiki2.success) {
            throw new Error("Failed to update wiki");
        }

        const wiki3 = await updateWikiService(wiki.data.wiki.id, {
            title: "test3",
            content: "test3",
            updateMessage: "test3", 
            author: user,
            tags: [],
        });
        if (!wiki3.success) {
            throw new Error("Failed to update wiki");
        }

        expect(wiki3.data.contributor.linesAdded).toBe(6);
        expect(wiki3.data.contributor.linesRemoved).toBe(1);
    })
})