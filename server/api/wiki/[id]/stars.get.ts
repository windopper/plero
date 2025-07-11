import { getWikiFavoritesCount } from '~/server/db/favoritesItem';

export default defineEventHandler(async (event) => {
    const wikiId = getRouterParam(event, 'id');

    if (!wikiId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'wikiId가 필요합니다.'
        });
    }

    const favoritesCountResult = await getWikiFavoritesCount(wikiId);

    if (!favoritesCountResult.success) {
        throw createError({
            statusCode: 500,
            statusMessage: `즐겨찾기 수 조회 실패: ${favoritesCountResult.error.message}`
        });
    }

    return {
        success: true,
        data: {
            wikiId,
            starCount: favoritesCountResult.data
        }
    };
}); 