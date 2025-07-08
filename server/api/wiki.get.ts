import { getWiki } from "./wikiStorage"

export default defineEventHandler(async (event) => {
    const { id } = getQuery(event) as { id: string }
    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: "Invalid request"
        })
    }
    return await getWiki(id)
})