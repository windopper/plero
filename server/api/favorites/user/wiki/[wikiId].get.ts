import { 
    isWikiFavoritedByUser, 
    getFavoritesItemsByWiki 
} from '~/server/db/favoritesItem';
import { getUserFavoritesLists } from '~/server/db/favoritesList';
import { User } from '~/server/db/schema';

export default defineEventHandler(async (event) => {
    const wikiId = getRouterParam(event, 'wikiId');

    if (!wikiId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'wikiId가 필요합니다.'
        });
    }

    const { user } = await requireUserSessionForTest(event);
    if (!user) {
        throw createError({
            statusCode: 401,
            statusMessage: '로그인이 필요합니다.'
        });
    }

    const userId = (user as User).id;

    // 병렬로 데이터 조회
    const [isFavoritedResult, favoritesItemsResult, userListsResult] = await Promise.all([
        isWikiFavoritedByUser(userId, wikiId),
        getFavoritesItemsByWiki(wikiId),
        getUserFavoritesLists(userId)
    ]);

    if (!isFavoritedResult.success) {
        throw createError({
            statusCode: 500,
            statusMessage: `즐겨찾기 상태 조회 실패: ${isFavoritedResult.error.message}`
        });
    }

    if (!favoritesItemsResult.success) {
        throw createError({
            statusCode: 500,
            statusMessage: `즐겨찾기 아이템 조회 실패: ${favoritesItemsResult.error.message}`
        });
    }

    if (!userListsResult.success) {
        throw createError({
            statusCode: 500,
            statusMessage: `사용자 목록 조회 실패: ${userListsResult.error.message}`
        });
    }

    // 사용자가 이 위키를 어떤 목록에 추가했는지 확인
    const userFavoritesItems = favoritesItemsResult.data.filter(item => item.userId === userId);
    const favoritedListIds = userFavoritesItems.map(item => item.listId);
    const favoritedLists = userListsResult.data.filter(list => favoritedListIds.includes(list.id));

    return {
        success: true,
        data: {
            wikiId,
            isFavorited: isFavoritedResult.data,
            favoritedLists,
            availableLists: userListsResult.data
        }
    };
}); 