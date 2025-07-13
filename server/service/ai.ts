import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatPromptTemplate, PromptTemplate } from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const gemini25Flash = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: process.env.NUXT_GEMINI_API_KEY,
    temperature: 0.7,
});

export async function generateWiki(instruction: string) {
    const chatPromptTemplate = ChatPromptTemplate.fromMessages([
        new SystemMessage("You are a helpful assistant."),
        new HumanMessage(instruction),
    ]);
    const chain = chatPromptTemplate.pipe(gemini25Flash);
    const stream = await chain.stream({
        instruction,
    });

    return stream;
}