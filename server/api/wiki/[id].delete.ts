import { deleteWiki } from "../../db/wiki"
import { requireUserSessionForTest } from "../../utils/testAuth"

export default defineEventHandler(async (event) => {
    const { id } = getRouterParams(event) as { id: string }
    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: "Invalid request"
        })
    }

    await requireUserSessionForTest(event)

    const result = await deleteWiki(id)
    if (!result.success) {
        throw createError({
            statusCode: 500,
            statusMessage: "Internal server error"
        })
    }
    return result
})