import { streamManager } from '~/server/utils/streamManager';

export default defineEventHandler(async (event) => {
    try {
        const activeSessionCount = streamManager.getActiveSessionCount();

        return {
            success: true,
            data: {
                activeSessionCount,
                timestamp: new Date().toISOString()
            }
        };
    } catch (error) {
        console.error('세션 상태 조회 오류:', error);
        throw createError({
            statusCode: 500,
            statusMessage: '세션 상태 조회 중 오류가 발생했습니다.'
        });
    }
}); 