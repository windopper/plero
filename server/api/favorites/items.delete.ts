import { removeFromFavorites } from '~/server/db/favoritesItem';

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const wikiId = query.wikiId as string;
    const listId = query.listId as string;

    if (!wikiId || !listId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'wikiId와 listId가 필요합니다.'
        });
    }

    const result = await removeFromFavorites(wikiId, listId);
    
    if (!result.success) {
        throw createError({
            statusCode: 500,
            statusMessage: result.error.message
        });
    }

    return {
        success: true,
        message: '즐겨찾기에서 제거되었습니다.'
    };
}); 