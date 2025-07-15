import { getWiki } from "~/server/db/wiki";
import { getWikiHistoriesByWikiId } from "~/server/db/wikiHistory";
import { User } from "~/server/db/schema";
import { checkAccessWiki } from "~/server/utils/wiki";

export default defineEventHandler(async (event) => {
    const { id } = getRouterParams(event) as { id: string }
    const { exclusiveStartKey, limit, sort } = getQuery(event) as {
        exclusiveStartKey?: string;
        limit?: string;
        sort?: "asc" | "desc";
    };

    const options: {
        exclusiveStartKey?: string;
        limit: number;
        sort: "asc" | "desc";
    } = {
        exclusiveStartKey,
        limit: parseInt(limit || "10") || 10,
        sort: sort || "desc"
    }

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: "Invalid request"
        })
    }

    const [histories, wiki, user] = await Promise.all([
        getWikiHistoriesByWikiId(id, options),
        getWiki(id),
        getUserSession(event)
    ])
    
    if (!histories.success) {
        throw createError({
            statusCode: 500,
            statusMessage: histories.error?.message ?? "Internal server error"
        })
    }

    if (!wiki.success) {
        throw createError({
            statusCode: 500,
            statusMessage: wiki.error?.message ?? "Internal server error"
        })
    }

    checkAccessWiki(wiki.data, user.user as User)

    return {
        success: true,
        data: histories.data.histories,
        pagination: {
            limit: options.limit,
            hasMore: histories.data.hasMore,
            lastEvaluatedKey: histories.data.lastEvaluatedKey
        }
    }
})