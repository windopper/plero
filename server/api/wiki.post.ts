import { User } from "../db/schema"
import { createWikiService } from "../service/wiki"
import { requireUserSessionForTest } from "../utils/testAuth"

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { title, content } = body
    if (!title || !content) {
        throw createError({
            statusCode: 400,
            statusMessage: "Invalid request"
        })
    }

    const { user } = await requireUserSessionForTest(event)
    const createWikiResult = await createWikiService({
        title,
        content,
        author: user as User,
    })

    if (!createWikiResult.success) {
        throw createError({
            statusCode: 500,
            statusMessage: "Failed to create wiki"
        })
    }

    return createWikiResult
})