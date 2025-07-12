import { getWikiHistoriesByUserId } from "~/server/db/wikiHistory";

export default defineEventHandler(async (event) => {
    const userId = getRouterParam(event, 'id')
    console.log(userId)
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

    return {
        success: true,
        data: result.data.histories,
        pagination: {
            limit: options.limit,
            hasMore: result.data.hasMore,
            lastEvaluatedKey: result.data.lastEvaluatedKey
        }
    }
})