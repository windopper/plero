import { checkAccessWiki } from "~/server/utils/wiki"
import { getWiki } from "../../db/wiki"
import { User } from "~/server/db/schema"

export default defineEventHandler(async (event) => {
    const { compact } = getQuery(event) as { compact: string }
    const { id } = getRouterParams(event) as { id: string }
    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: "위키 ID가 제공되지 않았습니다"
        })
    }

    const [wiki, user] = await Promise.all([
        getWiki(id),
        getUserSession(event)
    ])
    
    if (!wiki.success) {
        if (wiki.error.message === "Wiki not found") {
            throw createError({
                statusCode: 404,
                statusMessage: "요청한 위키를 찾을 수 없습니다",
            })
        } else {
            throw createError({
                statusCode: 500,
                statusMessage: "서버 내부 오류가 발생했습니다"
            })
        }
    }

    checkAccessWiki(wiki.data, user.user as User)

    if (compact) {
        return {
          success: true,
          data: {
            id: wiki.data.id,
            title: wiki.data.title,
            tags: wiki.data.tags,
            updatedAt: wiki.data.updatedAt,
          },
        };
    }

    return {
        success: true,
        data: wiki.data
    }
})