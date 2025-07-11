import { updateFavoritesList } from '~/server/db/favoritesList';
import { z } from 'zod';

const UpdateFavoritesListSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    color: z.string().optional(),
    sortOrder: z.number().int().optional(),
});

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id');
    const body = await readBody(event);
    
    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: '목록 ID가 필요합니다.'
        });
    }

    const validation = UpdateFavoritesListSchema.safeParse(body);
    if (!validation.success) {
        throw createError({
            statusCode: 400,
            statusMessage: '잘못된 요청 데이터입니다.',
            data: validation.error.errors
        });
    }

    const result = await updateFavoritesList(id, validation.data);
    
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