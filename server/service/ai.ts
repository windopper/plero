import { DataContentBlock, HumanMessage, MessageContent, MessageContentComplex, SystemMessage } from "@langchain/core/messages";
import { ChatPromptTemplate, PromptTemplate } from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { readFileSync } from 'fs';
import { join } from 'path';

// 파일 타입 정의
export interface UploadedFile {
    originalName: string;
    fileName: string;
    fileBase64: string;
    size: number;
    mimeType: string;
}

const gemini25Flash = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: process.env.NUXT_GEMINI_API_KEY,
    temperature: 0.7,
    streaming: true, // 스트리밍 활성화
});

const geminiProVision = new ChatGoogleGenerativeAI({
    model: "gemini-pro-vision",
    apiKey: process.env.NUXT_GEMINI_API_KEY,
    temperature: 0.7,
    streaming: true, // 스트리밍 활성화
});

// Jinja2 템플릿을 로드하는 함수
function loadPromptTemplate(templateName: string = 'wiki'): string {
    try {
        const templatePath = join(process.cwd(), `server/service/prompts/${templateName}.jinja2`);
        return readFileSync(templatePath, 'utf-8');
    } catch (error) {
        console.error(`Failed to load ${templateName} prompt template:`, error);
        throw error;
    }
}

// Gemini 멀티모달을 위한 파일 콘텐츠 준비
async function prepareMultimodalContent(instruction: string, files: UploadedFile[]) {
    const content: MessageContent & (string | (MessageContentComplex | DataContentBlock)[]) = [
        {
            type: "text",
            text: instruction
        },
    ];

    if (files.length > 0) {
        // 파일 설명 추가
        content.push({
            type: "text", 
            text: `\n\n다음 ${files.length}개의 파일이 첨부되었습니다. 이 파일들의 내용을 분석하여 위키를 작성해주세요:\n`
        });

        for (const file of files) {
            try {
                if (file.mimeType.startsWith('image/')) {
                    const base64Image = file.fileBase64;    
                    content.push({
                        type: "image_url",
                        image_url: `data:${file.mimeType};base64,${base64Image}`
                    });
                } else if (file.mimeType.startsWith('text/') || file.originalName.endsWith('.txt') || file.originalName.endsWith('.md')) {
                    const textContent = file.fileBase64;
                    content.push({
                        type: "text", 
                        text: textContent
                    });
                } else if (file.mimeType === 'application/pdf') {
                    const base64Pdf = file.fileBase64;
                    content.push({
                        type: 'image_url',
                        image_url: `data:${file.mimeType};base64,${base64Pdf}`
                    });
                }
            } catch (error) {
                console.error(`파일 처리 실패 (${file.originalName}):`, error);
                content.push({
                    type: "text",
                    text: `\n파일: ${file.originalName} - 파일 처리 중 오류가 발생했습니다.`
                });
            }
        }
    }

    return content;
}

export async function generateWiki(instruction: string) {
    try {
        // 템플릿 로드 및 변수 치환
        const template = loadPromptTemplate('wiki');
        const prompt = template.replace(/\{\{\s*instruction\s*\}\}/g, instruction);

        // AI에게 프롬프트 전송
        const chatPromptTemplate = ChatPromptTemplate.fromMessages([
            new SystemMessage("당신은 전문적인 위키 작성자입니다. 주어진 지침에 따라 정확한 형식으로 위키를 작성해주세요."),
            new HumanMessage(prompt),
        ]);

        const chain = chatPromptTemplate.pipe(gemini25Flash);
        const response = await chain.invoke({});

        return {
            success: true,
            data: response.content
        };
    } catch (error) {
        console.error('Failed to generate wiki:', error);
        return {
            success: false,
            error: { message: `위키 생성에 실패했습니다: ${error}` }
        };
    }
}

// 스트림 기반 위키 생성 함수 추가
export async function* generateWikiStream(instruction: string, abortSignal?: AbortSignal, files?: UploadedFile[]) {
    try {
        // 중단 신호가 이미 활성화된 경우 즉시 종료
        if (abortSignal?.aborted) {
            console.log('스트림 시작 전 중단 신호 감지');
            return;
        }

        // 멀티모달 콘텐츠 준비
        let messages: any[];
        if (files && files.length > 0) {
            // 템플릿 로드하여 시스템 메시지 구성
            const template = loadPromptTemplate('wiki');
            const systemMessage = "당신은 전문적인 위키 작성자입니다. 첨부된 파일들의 내용을 분석하여 정확한 형식의 위키를 작성해주세요.";
            
            // 멀티모달 콘텐츠 생성
            const prompt = template.replace(/\{\{\s*instruction\s*\}\}/g, instruction);
            const multimodalContent = await prepareMultimodalContent(prompt, files);
            
            messages = [
                new SystemMessage(systemMessage),
                new HumanMessage({ content: multimodalContent }),
            ];
        } else {
            // 파일이 없는 경우 기존 방식 사용
            const template = loadPromptTemplate('wiki');
            const prompt = template.replace(/\{\{\s*instruction\s*\}\}/g, instruction);
            
            messages = [
                new SystemMessage("당신은 전문적인 위키 작성자입니다. 주어진 지침에 따라 정확한 형식으로 위키를 작성해주세요."),
                new HumanMessage(prompt),
            ];
        }

        const selectedModel = gemini25Flash

        // 프롬프트 템플릿 생성
        const chatPromptTemplate = ChatPromptTemplate.fromMessages(messages);

        const chain = chatPromptTemplate.pipe(selectedModel);
        
        // 스트리밍 응답 처리 - AbortSignal을 올바르게 전달
        const streamConfig = abortSignal ? { signal: abortSignal } : {};
        const stream = await chain.stream({}, streamConfig);
        
        let chunkCount = 0;
        for await (const chunk of stream) {
            chunkCount++;
            
            // 매 청크마다 중단 신호 확인
            if (abortSignal?.aborted) {
                break;
            }
            
            if (chunk.content) {
                yield {
                    type: 'chunk',
                    data: chunk.content
                };
            }
        }
        
        // 정상 완료인 경우에만 complete 메시지 전송
        if (!abortSignal?.aborted) {
            console.log(`스트림 정상 완료 (총 청크: ${chunkCount})`);
            yield {
                type: 'complete',
                data: 'Stream completed'
            };
        } else {
            console.log(`스트림 중단됨 (처리된 청크: ${chunkCount})`);
        }
        
    } catch (error) {
        console.error('Failed to generate wiki stream:', error);
        
        // AbortError인 경우 별도 처리
        if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('abort'))) {
            console.log('스트림이 AbortError로 중단됨');
            yield {
                type: 'aborted',
                data: '스트림이 사용자에 의해 중단되었습니다.'
            };
        } else {
            yield {
                type: 'error',
                data: `위키 생성에 실패했습니다: ${error}`
            };
        }
    }
}

// 텍스트 편집 함수
export async function editText(originalText: string, instruction: string, files?: UploadedFile[]) {
    try {
        // 멀티모달 콘텐츠 준비 (편집용)
        let messages: any[];
        if (files && files.length > 0) {
            console.log(`편집용 멀티모달 파일 처리 시작: ${files.length}개 파일`);
            
            // 편집 지시사항과 원본 텍스트 결합
            const editInstruction = `원본 텍스트: ${originalText}\n\n편집 지시사항: ${instruction}`;
            
            // 멀티모달 콘텐츠 생성
            const multimodalContent = await prepareMultimodalContent(editInstruction, files);
            
            messages = [
                new SystemMessage("당신은 텍스트 편집 전문가입니다. 첨부된 파일들의 내용을 참고하여 원본 텍스트를 정확하게 편집해주세요."),
                new HumanMessage({ content: multimodalContent }),
            ];
        } else {
            // 파일이 없는 경우 기존 방식 사용
            const template = loadPromptTemplate('edit');
            const prompt = template
                .replace(/\{\{\s*original_text\s*\}\}/g, originalText)
                .replace(/\{\{\s*instruction\s*\}\}/g, instruction);

            messages = [
                new SystemMessage("당신은 텍스트 편집 전문가입니다. 주어진 지침에 따라 텍스트를 정확하게 편집해주세요."),
                new HumanMessage(prompt),
            ];
        }

        // AI에게 프롬프트 전송
        const chatPromptTemplate = ChatPromptTemplate.fromMessages(messages);
        const chain = chatPromptTemplate.pipe(gemini25Flash);
        const response = await chain.invoke({});

        return {
            success: true,
            data: response.content
        };
    } catch (error) {
        console.error('Failed to edit text:', error);
        return {
            success: false,
            error: { message: `텍스트 편집에 실패했습니다: ${error}` }
        };
    }
}

// 스트림 기반 텍스트 편집 함수
export async function* editTextStream(originalText: string, instruction: string, abortSignal?: AbortSignal, files?: UploadedFile[]) {
    let streamIterator: AsyncIterable<any> | null = null;
    
    try {
        // 중단 신호가 이미 활성화된 경우 즉시 종료
        if (abortSignal?.aborted) {
            console.log('스트림 시작 전 중단 신호 감지');
            return;
        }

        // 멀티모달 콘텐츠 준비 (편집용)
        let messages: any[];
        if (files && files.length > 0) {
            console.log(`편집용 멀티모달 파일 처리 시작: ${files.length}개 파일`);
            
            // 편집 지시사항과 원본 텍스트 결합
            const editInstruction = `원본 텍스트: ${originalText}\n\n편집 지시사항: ${instruction}`;
            
            // 멀티모달 콘텐츠 생성
            const multimodalContent = await prepareMultimodalContent(editInstruction, files);
            
            messages = [
                new SystemMessage("당신은 텍스트 편집 전문가입니다. 첨부된 파일들의 내용을 참고하여 원본 텍스트를 정확하게 편집해주세요."),
                new HumanMessage({ content: multimodalContent }),
            ];
        } else {
            // 파일이 없는 경우 기존 방식 사용
            const template = loadPromptTemplate('edit');
            const prompt = template
                .replace(/\{\{\s*original_text\s*\}\}/g, originalText)
                .replace(/\{\{\s*instruction\s*\}\}/g, instruction);

            messages = [
                new SystemMessage("당신은 텍스트 편집 전문가입니다. 주어진 지침에 따라 텍스트를 정확하게 편집해주세요."),
                new HumanMessage(prompt),
            ];
        }

        const selectedModel = gemini25Flash;

        // 프롬프트 템플릿 생성
        const chatPromptTemplate = ChatPromptTemplate.fromMessages(messages);

        const chain = chatPromptTemplate.pipe(selectedModel);
        
        // 스트리밍 응답 처리 - AbortSignal을 올바르게 전달
        console.log('LangChain 편집 스트림 시작, AbortSignal:', !!abortSignal);
        const streamConfig = abortSignal ? { signal: abortSignal } : {};
        const stream = await chain.stream({}, streamConfig);
        streamIterator = stream;
        
        let chunkCount = 0;
        for await (const chunk of stream) {
            chunkCount++;
            
            // 매 청크마다 중단 신호 확인
            if (abortSignal?.aborted) {
                break;
            }
            
            if (chunk.content) {
                yield {
                    type: 'chunk',
                    data: chunk.content
                };
            }
        }
        
        // 정상 완료인 경우에만 complete 메시지 전송
        if (!abortSignal?.aborted) {
            console.log(`편집 스트림 정상 완료 (총 청크: ${chunkCount})`);
            yield {
                type: 'complete',
                data: 'Stream completed'
            };
        } else {
            console.log(`편집 스트림 중단됨 (처리된 청크: ${chunkCount})`);
        }
        
    } catch (error) {
        console.error('Failed to edit text stream:', error);
        
        // AbortError인 경우 별도 처리
        if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('abort'))) {
            console.log('편집 스트림이 AbortError로 중단됨');
            yield {
                type: 'aborted',
                data: '스트림이 사용자에 의해 중단되었습니다.'
            };
        } else {
            yield {
                type: 'error',
                data: `텍스트 편집에 실패했습니다: ${error}`
            };
        }
    }
}