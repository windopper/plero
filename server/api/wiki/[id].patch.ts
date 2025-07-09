import { updateWikiService } from "../../service/wiki"
import { requireUserSessionForTest } from "../../utils/testAuth"
import { User } from "../../db/schema"

export default defineEventHandler(async (event) => {
    const { id } = getRouterParams(event) as { id: string }
    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: "Invalid request"
        })
    }

    const { title, content, updateMessage } = await readBody(event)
    if (!title || !content || !updateMessage) {
        throw createError({
            statusCode: 400,
            statusMessage: "Invalid request"
        })
    }

    const { user } = await requireUserSessionForTest(event)

    const result = await updateWikiService(id, {
        title,
        content,
        updateMessage,
        author: user as User
    })

    if (!result.success) {
        throw createError({
            statusCode: 500,
            statusMessage: result.error.message
        })
    }

    // 테스트에서 기대하는 형태로 데이터 구조 조정
    return {
        success: true,
        data: {
            ...result.data.wiki,
            updateMessage
        }
    }
})