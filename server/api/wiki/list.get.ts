import { Wiki } from "~/server/db/schema";
import { getWikiList } from "../../db/wiki";

export default defineEventHandler(async (event): Promise<{
    success: boolean;
    data: {
        wikis: Wiki[];
        hasMore: boolean;
        lastEvaluatedKey?: string;
    };
}> => {
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
    };
})