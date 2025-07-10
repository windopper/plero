import { getWikiHistoriesByWikiId } from "~/server/db/wikiHistory";

export default defineEventHandler(async (event) => {
    const { id } = getRouterParams(event) as { id: string }
    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: "Invalid request"
        })
    }

    const result = await getWikiHistoriesByWikiId(id);
    if (!result.success) {
        throw createError({
            statusCode: 500,
            statusMessage: "Internal server error"
        })
    }

    return {
        success: true,
        data: result.data
    }
})