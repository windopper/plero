import { checkPublicWikiTitleExists } from "../../db/wiki";

export default defineEventHandler(async (event): Promise<{
    success: boolean;
    data: {
        exists: boolean;
    };
}> => {
    const body = await readBody(event);
    const { title, excludeId } = body;
    
    if (!title || typeof title !== 'string') {
        throw createError({
            statusCode: 400,
            statusMessage: "Title is required"
        });
    }

    const result = await checkPublicWikiTitleExists(title, excludeId);
    
    if (!result.success) {
        throw createError({
            statusCode: 500,
            statusMessage: result.error?.message || "Internal server error"
        });
    }

    return {
        success: true,
        data: {
            exists: result.data
        }
    };
}); 