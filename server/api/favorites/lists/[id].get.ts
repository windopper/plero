import { getFavoritesItemsByList } from "~/server/db/favoritesItem";

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id');

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: '목록 ID가 필요합니다.'
        });
    }
   
    const result = await getFavoritesItemsByList(id);

    if (!result.success) {
        throw createError({
            statusCode: 500,
            statusMessage: result.error.message
        });
    }

    return {
        success: true,
        data: result.data
    };
});