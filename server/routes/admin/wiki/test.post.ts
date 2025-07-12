import type { User } from "~/server/db/schema"
import { createWikiService, updateWikiService } from "~/server/service/wiki"
import { debugWikis, pushDebugContributor, pushDebugWiki, pushDebugWikiHistory } from "./debugStorage"
import { v4 } from "uuid"

const wikiTitle = (i: number) => `PLERO/TITLE/${i}`
const wikiContent = (i: number) => `PLERO/CONTENT/${i}`

const updateWikiTitle = (i: number) => `PLERO/TITLE/UPDATE/${i}/${v4()}`
const updateWikiContent = (i: number) => `PLERO/CONTENT/UPDATE/${i}/${v4()}`

export default defineEventHandler(async (event) => {
    const { user } = await requireUserSession(event);

    // 30개 위키 페이지 생성
    for (let i = 0; i < 30; i++) {
        const wiki = await createWikiService({
          title: wikiTitle(i),
          content: wikiContent(i),
          tags: [],
          author: user as User,
        });

        if (wiki.success) {
            pushDebugWiki(wiki.data.wiki)
            pushDebugWikiHistory(wiki.data.history)
            pushDebugContributor(wiki.data.contributor)
        }
    }

    // 10명의 유저로 위키 페이지 업데이트
    for (let i = 0; i < 10; i++) {
        const testUser: User = {
            id: v4(),
            name: `testUser${i}`,
            email: `testUser${i}@test.com`,
            avatar: "https://example.com/avatar.png",
            provider: "google",
            role: "editor",
            isActive: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            loginCount: 0,
            preferences: {
                theme: "light",
                language: "en",
                notifications: true,
                emailNotifications: true,
            },
            metadata: {},
        } as User;

        await updateWikiService(debugWikis[0].id, {
            title: updateWikiTitle(i),
            content: updateWikiContent(i),
            tags: [],
            updateMessage: "test",
            author: testUser,
        });
    }

    // 업데이트 30번
    for (let i = 0; i < 30; i++) {
        const wikiId = debugWikis[0].id;
        const updateResult = await updateWikiService(wikiId, {
            title: updateWikiTitle(i),
            content: updateWikiContent(i),
            tags: [],
            updateMessage: "test",
            author: user as User,
        });
    }
})