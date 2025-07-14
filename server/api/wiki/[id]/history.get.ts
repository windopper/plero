import { getWiki } from "~/server/db/wiki";
import { getWikiHistoriesByWikiId } from "~/server/db/wikiHistory";
import { User } from "~/server/db/schema";
import { checkAccessWiki } from "~/server/utils/wiki";

export default defineEventHandler(async (event) => {
    const { id } = getRouterParams(event) as { id: string }
    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: "Invalid request"
        })
    }

    const [histories, wiki, user] = await Promise.all([
        getWikiHistoriesByWikiId(id),
        getWiki(id),
        getUserSession(event)
    ])
    
    if (!histories.success) {
        throw createError({
            statusCode: 500,
            statusMessage: "Internal server error"
        })
    }

    if (!wiki.success) {
        throw createError({
            statusCode: 500,
            statusMessage: "Internal server error"
        })
    }

    checkAccessWiki(wiki.data, user.user as User)

    return {
        success: true,
        data: histories.data
    }
})