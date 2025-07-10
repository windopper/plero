import { getWikiContributorsByWikiId } from "~/server/db/wikiContributor";

export default defineEventHandler(async (event) => {
    const { id } = getRouterParams(event) as { id: string }
    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: "Invalid request"
        })
    }

    const result = await getWikiContributorsByWikiId(id);

    if (!result.success) {
        throw createError({
            statusCode: 500,
            statusMessage: "Internal server error"
        })
    }

    return result
})