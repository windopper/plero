import { getWiki } from "../../db/wiki"

export default defineEventHandler(async (event) => {
    const { compact } = getQuery(event) as { compact: string }
    const { id } = getRouterParams(event) as { id: string }
    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: "Invalid request"
        })
    }

    const result = await getWiki(id);
    
    if (!result.success) {
        if (result.error.message === "Wiki not found") {
            throw createError({
                statusCode: 404,
                statusMessage: "Wiki not found"
            })
        } else {
            throw createError({
                statusCode: 500,
                statusMessage: "Internal server error"
            })
        }
    }

    if (compact) {
        return {
          success: true,
          data: {
            id: result.data.id,
            title: result.data.title,
            tags: result.data.tags,
            updatedAt: result.data.updatedAt,
          },
        };
    }

    return result
})