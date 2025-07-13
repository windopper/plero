import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatPromptTemplate, PromptTemplate } from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { readFileSync } from 'fs';
import { join } from 'path';

const gemini25Flash = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: process.env.NUXT_GEMINI_API_KEY,
    temperature: 0.7,
    streaming: true, // 스트리밍 활성화
});

// Jinja2 템플릿을 로드하는 함수
function loadPromptTemplate(): string {
    try {
        const templatePath = join(process.cwd(), 'server/service/prompts/wiki.jinja2');
        return readFileSync(templatePath, 'utf-8');
    } catch (error) {
        console.error('Failed to load wiki prompt template:', error);
        // 기본 프롬프트 반환
        return `당신은 전문적인 위키 작성자입니다. 주제 "{{ instruction }}"에 대해 상세한 위키를 작성해주세요.
        
**제목:** (위키 제목)
**내용:** (마크다운 형식의 내용)
**태그:** (쉼표로 구분된 태그들)`;
    }
}

export async function generateWiki(instruction: string) {
    try {
        // 템플릿 로드 및 변수 치환
        const template = loadPromptTemplate();
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
export async function* generateWikiStream(instruction: string, abortSignal?: AbortSignal) {
    let streamIterator: AsyncIterable<any> | null = null;
    
    try {
        // 중단 신호가 이미 활성화된 경우 즉시 종료
        if (abortSignal?.aborted) {
            console.log('스트림 시작 전 중단 신호 감지');
            return;
        }

        // 템플릿 로드 및 변수 치환
        const template = loadPromptTemplate();
        const prompt = template.replace(/\{\{\s*instruction\s*\}\}/g, instruction);

        // AI에게 프롬프트 전송
        const chatPromptTemplate = ChatPromptTemplate.fromMessages([
            new SystemMessage("당신은 전문적인 위키 작성자입니다. 주어진 지침에 따라 정확한 형식으로 위키를 작성해주세요."),
            new HumanMessage(prompt),
        ]);

        const chain = chatPromptTemplate.pipe(gemini25Flash);
        
        // 스트리밍 응답 처리 - AbortSignal을 올바르게 전달
        console.log('LangChain 스트림 시작, AbortSignal:', !!abortSignal);
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