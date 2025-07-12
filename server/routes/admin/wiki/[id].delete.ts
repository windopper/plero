import { _permanantDeleteWikiService } from "~/server/service/wiki";

export default defineEventHandler(async (event) => {
    const { id } = getRouterParams(event);
    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: "Bad Request"
        });
    }

    console.log(id);    

    const result = await _permanantDeleteWikiService(id);
    if (!result.success) {
        throw createError({
            statusCode: 500,
            statusMessage: result.error?.message || "Internal Server Error"
        });
    }
    return result;
});