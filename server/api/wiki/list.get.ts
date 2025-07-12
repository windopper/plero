import { getWikiList } from "../../db/wiki";

export default defineEventHandler(async (event) => {
    const { query, exclusiveStartKey, limit } = getQuery(event);
    const result = await getWikiList({
        query: (query as string) || "", 
        exclusiveStartKey: exclusiveStartKey as string, 
        limit: Number(limit) || 10
    });
    
    if (!result.success) {
        throw createError({
            statusCode: 500,
            statusMessage: result.error?.message || "Internal Server Error",
        });
    }
    
    return {
        success: true,
        data: result.data,
        pagination: {
            limit: Number(limit) || 10,
            hasMore: result.data.hasMore,
            lastEvaluatedKey: result.data.lastEvaluatedKey
        }
    };
})