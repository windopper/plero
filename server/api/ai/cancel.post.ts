import { streamManager } from '~/server/utils/streamManager';

export default defineEventHandler(async (event) => {
    try {
        const { sessionId } = await readBody(event);

        if (!sessionId || typeof sessionId !== 'string') {
            throw createError({
                statusCode: 400,
                statusMessage: '세션 ID가 필요합니다.'
            });
        }

        const cancelled = streamManager.cancelSession(sessionId);

        if (!cancelled) {
            throw createError({
                statusCode: 404,
                statusMessage: '세션을 찾을 수 없습니다.'
            });
        }

        return {
            success: true,
            message: '스트림이 성공적으로 취소되었습니다.',
            sessionId
        };
    } catch (error) {
        console.error('스트림 취소 오류:', error);
        throw createError({
            statusCode: 500,
            statusMessage: '스트림 취소 중 오류가 발생했습니다.'
        });
    }
}); 