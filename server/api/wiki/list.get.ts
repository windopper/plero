import { getWikiList } from "../../db/wiki";

export default defineEventHandler(async (event) => {
    const { query, page, limit } = getQuery(event);
    const result = await getWikiList({
        query: (query as string) || "", 
        page: Number(page) || 1, 
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
            currentPage: Number(page) || 1,
            limit: Number(limit) || 10,
            totalCount: result.data.totalCount,
            hasMore: result.data.hasMore,
            totalPages: Math.ceil(result.data.totalCount / (Number(limit) || 10))
        }
    };
})