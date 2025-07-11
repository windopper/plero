import { _permanantDeleteWikiService, deleteWikiService } from "~/server/service/wiki"
import { requireUserSessionForTest } from "../../utils/testAuth"
import { User } from "~/server/db/schema"

export default defineEventHandler(async (event) => {
    const { id, deleteMessage } = getRouterParams(event) as { id: string, deleteMessage: string }
    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: "Invalid request"
        })
    }

    const { user } = await requireUserSessionForTest(event)

    const result = await deleteWikiService(id, {
        author: user as User,
        deleteMessage: deleteMessage || "위키 삭제"
    })
    if (!result.success) {
        throw createError({
            statusCode: 500,
            statusMessage: "Internal server error"
        })
    }
    return result
})