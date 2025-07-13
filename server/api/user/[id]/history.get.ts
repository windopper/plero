import { getWikisByIds } from "~/server/db/wiki";
import { getWikiHistoriesByUserId } from "~/server/db/wikiHistory";

export default defineEventHandler(async (event) => {
    const userId = getRouterParam(event, 'id')
    if (!userId) {
        throw createError({
            statusCode: 400,
            statusMessage: "Invalid request"
        })
    }

    const { exclusiveStartKey, limit, sort } = getQuery(event) as { 
        exclusiveStartKey?: string, 
        limit?: string,
        sort?: "asc" | "desc"
    }

    const options = {
        userId,
        exclusiveStartKey,
        limit: limit ? parseInt(limit) : 30,
        sort: sort as "asc" | "desc"
    };

    const result = await getWikiHistoriesByUserId(options);
    if (!result.success) {
        throw createError({
            statusCode: 500,
            statusMessage: result.error?.message ?? "Internal server error"
        })
    }

    const currentUser = await getUserSession(event);
    const wikiIds = new Set(result.data.histories.map((history) => history.wikiId));
    const wikisResult = await getWikisByIds(Array.from(wikiIds));
    if (!wikisResult.success) {
        throw createError({
            statusCode: 500,
            statusMessage: wikisResult.error?.message ?? "Internal server error"
        })
    }

    const wikisMap = new Map(wikisResult.data.map((wiki) => [wiki.id, wiki]));
    const histories = result.data.histories.map((history) => {
        const wiki = wikisMap.get(history.wikiId);
        if (!wiki) return { ...history, isPrivate: true };
        if (!wiki.isPublished && wiki.authorId !== currentUser.user?.id) return { ...history, isPrivate: true };
        return { ...history, isPrivate: false };
    })

    return {
        success: true,
        data: histories,
        pagination: {
            limit: options.limit,
            hasMore: result.data.hasMore,
            lastEvaluatedKey: result.data.lastEvaluatedKey
        }
    }
})