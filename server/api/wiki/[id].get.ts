import { getWiki } from "../../db/wiki"

export default defineEventHandler(async (event) => {
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
    return result
})