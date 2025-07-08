import { getWiki, setWiki } from "./wikiStorage" 

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { id, content } = body
    if (!id || !content) {
        throw createError({
            statusCode: 400,
            statusMessage: "Invalid request"
        })
    }
    setWiki(id, content)
    return {
        message: "Success",
        content: await getWiki(id)
    }
})