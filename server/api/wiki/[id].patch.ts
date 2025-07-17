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

    const { title, content, updateMessage, tags, version } = await readBody(event)
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
        tags: tags || [],
        author: user as User,
        version: version || "0"
    })

    if (!result.success) {
        console.log(result.error.message)
        if (result.error.message === "자동 병합이 불가능합니다.") {
            return {
                success: false,
                error: {
                    message: "자동 병합이 불가능합니다."
                }
            }
        }
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