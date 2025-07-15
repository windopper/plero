import { generateWiki, generateWikiStream, UploadedFile } from "~/server/service/ai";
import { streamManager } from "~/server/utils/streamManager";
import { v4 as uuidv4 } from 'uuid';

export default defineEventHandler(async (event) => {
    try {
        let instruction: string;
        let stream: boolean;
        let uploadedFiles: UploadedFile[] = [];

        // Content-Type에 따라 다르게 처리
        const contentType = getHeader(event, 'content-type') || '';
        console.log("Content-Type: ", contentType);
        
        if (contentType.includes('multipart/form-data')) {
            // FormData 처리 (파일 업로드 포함)
            const formData = await readMultipartFormData(event);
            
            if (!formData) {
                throw createError({
                    statusCode: 400,
                    statusMessage: '폼 데이터를 읽을 수 없습니다.'
                });
            }

            // instruction과 stream 값 추출
            const instructionField = formData.find(field => field.name === 'instruction');
            const streamField = formData.find(field => field.name === 'stream');
            
            instruction = instructionField?.data?.toString() || '';
            stream = streamField?.data?.toString() === 'true';

            // 파일들 처리
            const fileFields = formData.filter(field => field.name === 'files');
            console.log("File Count: ", fileFields.length);
            for (const fileField of fileFields) {
                if (fileField.filename && fileField.data) {
                    const fileId = uuidv4();
                    const fileExtension = fileField.filename.split('.').pop() || '';
                    const fileName = `${fileId}.${fileExtension}`;
                    
                    uploadedFiles.push({
                        originalName: fileField.filename,
                        fileName: fileName,
                        fileBase64: fileField.data.toString('base64'),
                        size: fileField.data.length,
                        mimeType: fileField.type || 'application/octet-stream'
                    });
                }
            }
        } else {
            // JSON 처리 (기존 방식)
            const body = await readBody(event);
            instruction = body.instruction;
            stream = body.stream;
        }

        if (!instruction || typeof instruction !== 'string' || instruction.trim().length === 0) {
            throw createError({
                statusCode: 400,
                statusMessage: '위키 생성 지시사항이 필요합니다.'
            });
        }

        // 스트림 요청인 경우
        if (stream) {
            // 새 스트림 세션 생성
            const sessionId = streamManager.createSession(instruction.trim(), 'wiki');
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
                        const wikiStream = generateWikiStream(
                            instruction.trim(), 
                            abortController.signal, 
                            uploadedFiles.length > 0 ? uploadedFiles : undefined
                        );
                        
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