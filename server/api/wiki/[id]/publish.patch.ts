import { checkAccessWiki } from "~/server/utils/wiki";
import { getWiki, updateWiki } from "../../../db/wiki";
import { requireUserSessionForTest } from "../../../utils/testAuth";
import { User } from "~/server/db/schema";

export default defineEventHandler(async (event) => {
    const { id } = getRouterParams(event) as { id: string };
    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: "Invalid request"
        });
    }

    const { isPublished } = await readBody(event);
    if (typeof isPublished !== 'boolean') {
        throw createError({
            statusCode: 400,
            statusMessage: "isPublished must be a boolean"
        });
    }

    const { user } = await requireUserSessionForTest(event);

    const wiki = await getWiki(id);
    if (!wiki.success) {
        throw createError({
            statusCode: 500,
            statusMessage: wiki.error?.message || "Failed to get wiki"
        });
    }

    checkAccessWiki(wiki.data, user as User)

    const result = await updateWiki(id, {
        isPublished,
        updatedAt: Date.now()
    });

    if (!result.success) {
        console.error(result.error);
        throw createError({
            statusCode: 500,
            statusMessage: result.error?.message || "Failed to update wiki"
        });
    }

    return {
        success: true,
        data: result.data
    };
}); 