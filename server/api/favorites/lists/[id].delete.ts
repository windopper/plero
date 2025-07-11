import { deleteFavoritesList } from '~/server/db/favoritesList';
import { removeAllItemsFromList } from '~/server/db/favoritesItem';

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id');
    
    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: '목록 ID가 필요합니다.'
        });
    }

    // 먼저 목록에 포함된 모든 아이템 제거
    const removeItemsResult = await removeAllItemsFromList(id);
    if (!removeItemsResult.success) {
        throw createError({
            statusCode: 500,
            statusMessage: `아이템 제거 실패: ${removeItemsResult.error.message}`
        });
    }

    // 그 다음 목록 삭제
    const result = await deleteFavoritesList(id);
    
    if (!result.success) {
        throw createError({
            statusCode: 500,
            statusMessage: result.error.message
        });
    }

    return {
        success: true,
        message: '즐겨찾기 목록이 삭제되었습니다.'
    };
}); 