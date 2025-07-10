import { afterAll, describe, expect, it } from "vitest";
import { getTestUser } from '../../server/utils/testAuth'
import { createWikiService, deleteWikiService, revertWikiService, updateWikiService } from "~/server/service/wiki";
import { deleteWiki, getWiki } from "~/server/db/wiki";

describe("wiki service", () => {

    const shouldDeleteWikiList: string[] = [];

    afterAll(() => {
        for (const wikiId of shouldDeleteWikiList) {
            deleteWiki(wikiId);
        }
    });

    it("위키 생성", async () => {
        const user = getTestUser();
        const wiki = await createWikiService({
            title: "test",
            content: "test",
            author: user,
        });
        if (!wiki.success) {
            throw new Error("Failed to create wiki");
        }
        shouldDeleteWikiList.push(wiki.data.wiki.id);

        const getWikiResult = await getWiki(wiki.data.wiki.id);
        if (!getWikiResult.success) {
            throw new Error("Failed to get wiki");
        }

        expect(getWikiResult.data.title).toBe("test");
        expect(getWikiResult.data.content).toBe("test");
        expect(getWikiResult.data.version).toBe(1);
    })

    it("위키 수정", async () => {
        const user = getTestUser();
        const wiki = await createWikiService({
            title: "test",
            content: "test",
            author: user,
        });
        if (!wiki.success) {
            throw new Error("Failed to create wiki");
        }
        shouldDeleteWikiList.push(wiki.data.wiki.id);

        const wiki2 = await updateWikiService(wiki.data.wiki.id, {
            title: "test2", 
            content: "test2",
            updateMessage: "test2",
            author: user,
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

    it("위키 삭제", async () => {
        const user = getTestUser();
        const wiki = await createWikiService({
            title: "test",
            content: "test",
            author: user,
        });
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

        const wiki = await createWikiService({
            title: "test",
            content: "test",
            author: user,
        });
        if (!wiki.success) {
            throw new Error("Failed to create wiki");
        }
        shouldDeleteWikiList.push(wiki.data.wiki.id);

        const wiki2 = await updateWikiService(wiki.data.wiki.id, {
            title: "test2",
            content: "test2",
            updateMessage: "test2",
            author: user,
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
    });
})