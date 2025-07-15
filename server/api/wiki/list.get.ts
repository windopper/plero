import { Wiki } from "~/server/db/schema";
import { getWikiList } from "../../db/wiki";

export default defineEventHandler(async (event): Promise<{
    success: boolean;
    data: Wiki[];
    pagination: {
        limit: number;
        hasMore: boolean;
        lastEvaluatedKey?: string;
    };
}> => {
    const { query, exclusiveStartKey, limit } = getQuery(event);

    const options: {
        query: string;
        exclusiveStartKey?: string;
        limit: number;
    } = {
        query: (query as string) || "",
        exclusiveStartKey: exclusiveStartKey as string,
        limit: Number(limit) || 10
    }

    const result = await getWikiList({
        query: options.query, 
        exclusiveStartKey: options.exclusiveStartKey, 
        limit: options.limit
    });
    
    if (!result.success) {
        throw createError({
            statusCode: 500,
            statusMessage: result.error?.message || "Internal Server Error",
        });
    }
    
    return {
        success: true,
        data: result.data.wikis,
        pagination: {
            limit: options.limit,
            hasMore: result.data.hasMore,
            lastEvaluatedKey: result.data.lastEvaluatedKey,
        },
    };
})