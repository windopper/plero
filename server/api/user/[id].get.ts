import { getUser } from "~/server/db/user"

export default defineEventHandler(async (event) => {
    const { id } = getRouterParams(event) as { id: string }
    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: "Invalid request"
        })
    }

    const result = await getUser(id);

    if (!result.success) {
        throw createError({
            statusCode: 500,
            statusMessage: "Internal server error"
        })
    }

    return {
        success: true,
        data: {
            id: result.data.id,
            name: result.data.name,
            displayName: result.data.displayName,
            avatar: result.data.avatar,
            createdAt: result.data.createdAt,
            updatedAt: result.data.updatedAt,
            bio: result.data.bio,
            lastLoginAt: result.data.lastLoginAt,
        }
    }
})