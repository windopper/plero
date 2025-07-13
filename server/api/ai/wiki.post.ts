import { generateWiki, generateWikiStream } from "~/server/service/ai";
import { streamManager } from "~/server/utils/streamManager";

export default defineEventHandler(async (event) => {
    try {
        const { instruction, stream } = await readBody(event);

        if (!instruction || typeof instruction !== 'string' || instruction.trim().length === 0) {
            throw createError({
                statusCode: 400,
                statusMessage: '위키 생성 지시사항이 필요합니다.'
            });
        }

        // 스트림 요청인 경우
        if (stream) {
            // 새 스트림 세션 생성
            const sessionId = streamManager.createSession(instruction.trim());
            const abortController = streamManager.getAbortController(sessionId);

            if (!abortController) {
                throw createError({
                    statusCode: 500,
                    statusMessage: '스트림 세션 생성에 실패했습니다.'
                });
            }

            // SSE 헤더 설정
            setHeader(event, 'Content-Type', 'text/event-stream');
            setHeader(event, 'Cache-Control', 'no-cache');
            setHeader(event, 'Connection', 'keep-alive');
            setHeader(event, 'Access-Control-Allow-Origin', '*');
            setHeader(event, 'Access-Control-Allow-Headers', 'Cache-Control');

            // 스트림 응답 처리
            const encoder = new TextEncoder();
            let isStreamCancelled = false;
            
            const readableStream = new ReadableStream({
                async start(controller) {
                    // 클라이언트에 세션 ID 전달
                    const sessionData = `data: ${JSON.stringify({
                        type: 'session',
                        sessionId: sessionId
                    })}\n\n`;
                    controller.enqueue(encoder.encode(sessionData));
                    
                    try {
                        const wikiStream = generateWikiStream(instruction.trim(), abortController.signal);
                        
                        for await (const chunk of wikiStream) {
                            // 다중 중단 조건 확인
                            if (abortController.signal.aborted || isStreamCancelled) {
                                console.log(`서버에서 스트림 중단 감지 - 루프 탈출 (세션: ${sessionId})`);
                                break;
                            }

                            const data = `data: ${JSON.stringify(chunk)}\n\n`;
                            
                            try {
                                controller.enqueue(encoder.encode(data));
                            } catch (enqueueError) {
                                console.log(`controller.enqueue 실패 - 클라이언트 연결 끊김 (세션: ${sessionId}):`, enqueueError);
                                isStreamCancelled = true;
                                streamManager.cancelSession(sessionId);
                                break;
                            }
                            
                            // 중단 타입별 처리
                            if (chunk.type === 'aborted') {
                                console.log(`AI에서 중단 신호 받음 (세션: ${sessionId})`);
                                break;
                            }
                        }
                        
                        if (!isStreamCancelled && !abortController.signal.aborted) {
                            console.log(`스트림 정상 종료 (세션: ${sessionId})`);
                            streamManager.completeSession(sessionId);
                        } else {
                            console.log(`스트림 중단 종료 (세션: ${sessionId})`);
                            streamManager.cancelSession(sessionId);
                        }
                        
                        controller.close();
                    } catch (error) {
                        console.error(`서버 스트림 에러 (세션: ${sessionId}):`, error);
                        
                        if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('abort'))) {
                            console.log(`서버에서 AbortError 감지 - 정상 중단 (세션: ${sessionId})`);
                        } else if (!isStreamCancelled) {
                            // 일반 에러인 경우에만 에러 메시지 전송
                            try {
                                const errorData = `data: ${JSON.stringify({
                                    type: 'error',
                                    data: '스트림 처리 중 오류가 발생했습니다.'
                                })}\n\n`;
                                controller.enqueue(encoder.encode(errorData));
                            } catch (enqueueError) {
                                console.log(`에러 메시지 전송 실패 - 클라이언트 이미 연결 끊김 (세션: ${sessionId})`);
                            }
                        }
                        
                        // 에러 발생 시에도 세션 정리
                        streamManager.cancelSession(sessionId);
                        controller.close();
                    }
                },
                cancel(reason) {
                    // 클라이언트가 스트림을 취소했을 때 호출됨
                    console.log(`클라이언트에서 스트림 취소 요청 (세션: ${sessionId}):`, reason);
                    isStreamCancelled = true;
                    streamManager.cancelSession(sessionId);
                }
            });

            return readableStream;
        }

        // 기존 일반 요청 처리
        const result = await generateWiki(instruction.trim());

        if (!result.success) {
            throw createError({
                statusCode: 500,
                statusMessage: result.error?.message || '위키 생성에 실패했습니다.'
            });
        }

        return {
            success: true,
            data: result.data
        };
    } catch (error) {
        console.error('AI wiki generation error:', error);
        throw createError({
            statusCode: 500,
            statusMessage: '서버 오류가 발생했습니다.'
        });
    }
});