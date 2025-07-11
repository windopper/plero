import { addToFavorites } from '~/server/db/favoritesItem';
import { z } from 'zod';
import { User } from '~/server/db/schema';

const AddToFavoritesSchema = z.object({
    wikiId: z.string().uuid(),
    listId: z.string().uuid(),
    note: z.string().max(200).optional(),
});

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    
    const { user } = await requireUserSessionForTest(event);
    if (!user) {
        throw createError({
            statusCode: 401,
            statusMessage: '로그인이 필요합니다.'
        });
    }
    
    const validation = AddToFavoritesSchema.safeParse(body);
    if (!validation.success) {
        throw createError({
            statusCode: 400,
            statusMessage: '잘못된 요청 데이터입니다.',
            data: validation.error.errors
        });
    }

    const result = await addToFavorites({
        userId: (user as User).id,
        ...validation.data
    });
    
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