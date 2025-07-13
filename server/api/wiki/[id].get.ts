import { getWiki } from "../../db/wiki"

export default defineEventHandler(async (event) => {
    const { compact } = getQuery(event) as { compact: string }
    const { id } = getRouterParams(event) as { id: string }
    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: "위키 ID가 제공되지 않았습니다"
        })
    }

    const result = await getWiki(id);
    
    if (!result.success) {
        if (result.error.message === "Wiki not found") {
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

    if (compact) {
        return {
          success: true,
          data: {
            id: result.data.id,
            title: result.data.title,
            tags: result.data.tags,
            updatedAt: result.data.updatedAt,
          },
        };
    }

    return result
})