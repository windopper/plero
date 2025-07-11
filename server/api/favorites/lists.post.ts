import { createFavoritesList } from '~/server/db/favoritesList';
import { z } from 'zod';
import { User } from '~/server/db/schema';

const CreateFavoritesListSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    color: z.string().optional(),
    isDefault: z.boolean().default(false),
    sortOrder: z.number().int().default(0),
});

export default defineEventHandler(async (event) => {
    const body = await readBody(event);

    const { user } = await requireUserSessionForTest(event);
    if (!user) {
        throw createError({
            statusCode: 401,
            message: '로그인이 필요합니다.'
        });
    }
    
    const validation = CreateFavoritesListSchema.safeParse({
        userId: (user as User).id,
        ...body
    });
    if (!validation.success) {
        throw createError({
            statusCode: 400,
            message: '잘못된 요청 데이터입니다.',
            data: validation.error.errors
        });
    }

    const result = await createFavoritesList({
        userId: (user as User).id,
        ...validation.data
    });
    
    if (!result.success) {
        throw createError({
            statusCode: 500,
            message: result.error.message
        });
    }

    return {
        success: true,
        data: result.data
    };
}); 