import { getUserFavoritesLists } from '~/server/db/favoritesList';
import { User } from '~/server/db/schema';

export default defineEventHandler(async (event) => {
    const { user } = await requireUserSessionForTest(event);
    if (!user) {
        throw createError({
            statusCode: 401,
            statusMessage: '로그인이 필요합니다.'
        });
    }

    const result = await getUserFavoritesLists((user as User).id);
    
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