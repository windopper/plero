import { getWiki } from "~/server/db/wiki";
import { getWikiLatestHistoryByWikiIdAndVersion } from "~/server/db/wikiHistory";

export default defineEventHandler(async (event) => {
    const { id, version } = getRouterParams(event);
    const { user } = await requireUserSession(event);

    const getWikiResult = await getWiki(id);
    if (!getWikiResult.success) {
        return getWikiResult;
    }
    const wiki = getWikiResult.data;

    if (wiki.authorId !== user.id) {
        throw createError({
            statusCode: 403,
            statusMessage: "권한이 없습니다."
        })
    }

    const getWikiHistoryResult = await getWikiLatestHistoryByWikiIdAndVersion(id, Number(version));
    if (!getWikiHistoryResult.success) {
        return getWikiHistoryResult;
    }
    const wikiHistory = getWikiHistoryResult.data;

    return {
        success: true,
        data: wikiHistory
    };
})