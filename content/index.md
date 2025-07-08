---
title: "나만의 MCP 서버 만들기 (with. Smithery)"
tags: ["takeoff", "mcp", "smithery", "ai"]
date: "2025-07-06"
---

# 나만의 MCP 서버 만들기 (with. Smithery)

2024년 11월 25일 Anthropic이 개발한 [MCP](https://modelcontextprotocol.io/introduction) (Model Context Protocol)은 AI 모델과 외부 데이터 소스 또는 도구를 연결해주는
개방형 표준 프로토콜이다.

MCP는 AI 분야의 USB-C 포트에 비유되며, 다양한 애플리케이션과 도구, 데이터베이스, 웹 서비스 등이 MCP를 통해 하나의 표준
인터페이스로 연결 될 수 있다.

모델 컨텍스트 프로토콜의 전체 사양과 사용 방법은 [여기](https://modelcontextprotocol.io/introduction)에서 확인할 수 있다.

Takeoff. 서비스의 MCP 서버를 만들기위해 공식 SDK를 사용해도 되지만, Smithery를 사용하여 MCP 서버를 배포하고 
쉽게 사용할 수 있도록 할 것이다.

## Smithery
[Smithery](https://smithery.ai/)는 MCP 서버의 중앙 레지스트리 및 관리 플랫폼으로 개발자들이 다양한 AI 확장 기능을 쉽게 활용할 수 있도록
지원한다.

![smithery-home](./markdown/create-mcp-server-with-smithery/0.png)

## MCP 서버 구축
[Smithery Getting Started](https://smithery.ai/docs/build/getting-started)에서 타입스크립트와 Smithery CLI를 사용하여
MCP 서버를 쉽게 구축할 수 있도록 가이드를 제공하고 있으며, 이를 참고하여 MCP 서버를 구축하였다.

1. CLI 설치
```bash
npm install -g @smithery/cli
```

2. 프로젝트 초기화
```bash
npm create smithery
```

3. 서버 생성
`src/index.ts` 파일에서 서버의 기능을 구현한다

구현한 서버 기능은 다음과 같다.
- 최근 게시글 조회 (get_latest_posts)
- 최근 주간 뉴스 조회 (get_latest_weekly_news)

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Optional: Define configuration schema to require configuration at connection time
export const configSchema = z.object({
  debug: z.boolean().default(false).describe("Enable debug logging"),
});

export default function createStatelessServer({
  config,
}: {
  config: z.infer<typeof configSchema>;
}) {
  const server = new McpServer({
    name: "mcp-takeoff",
    version: "1.0.0",
  });

  // Add a tool
  server.tool(
    "get_latest_posts",
    "Get the latest AI issue posts from the Takeoff API",
    {
    },
    async () => {
      try {
        const result = await makeTakeoffRequest("posts");
        return {
          content: [
            {
              type: "text",
              text: result ? JSON.stringify(result, null, 2) : "Failed to fetch posts"
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching posts: ${error instanceof Error ? error.message : String(error)}`
            }
          ],
          isError: true
        };
      }
    }
  );

  server.tool(
    "get_latest_weekly_news",
    "Get the latest weekly news from the Takeoff API",
    {},
    async () => {
      try {
        const result = await makeTakeoffRequest("weeklynews");
        return {
          content: [
            {
              type: "text",
              text: result ? JSON.stringify(result, null, 2) : "Failed to fetch posts"
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching weekly news: ${error instanceof Error ? error.message : String(error)}`
            }
          ],
          isError: true
        };
      }
    }
  );

  return server.server;
}

async function makeTakeoffRequest(endpoint: string) {
  const response = await fetch(`https://ai-takeoff.dev/api/${endpoint}`, {
    headers: {
      "User-Agent": "mcp-takeoff/1.0",
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${endpoint}: ${response.statusText}`);
  }
  return response.json();
}

```

4. 개발 환경 시작
```bash
npm run dev
``` 

또는 

```bash
npx @smithery/cli dev
```

개발 환경이 시작되면 터미널 로깅과 함께 로컬 환경으로 실행된 MCP 서버가 ngrok으로 외부에 노출되어 smithery playground 탭에서 
MCP 서버를 테스트 할 수 있다.

![smithery-dev](./markdown/create-mcp-server-with-smithery/1.png)

![smithery-playground](./markdown/create-mcp-server-with-smithery/2.png)

잘 작동하는지 확인하기 위해 최근 게시글 조회 기능을 테스트

![smithery-test](./markdown/create-mcp-server-with-smithery/3.png)

5. MCP 서버 배포
`smithery.yaml`에서 배포 설정을 추가한다.
```yaml
runtime: typescript
```

## MCP 서버 배포 

smithery 공식 페이지에서 `Deploy Server` 버튼을 클릭하여 배포를 시작한다.
![smithery-deploy](./markdown/create-mcp-server-with-smithery/4.png)

배포가 성공하면 `Success` 메시지가 표시된다.
![smithery-deploy-success](./markdown/create-mcp-server-with-smithery/5.png)

이제 Smithery Playground에서 배포된 MCP 서버를 테스트 할 수 있다.
![smithery-playground-deploy](./markdown/create-mcp-server-with-smithery/6.png)

## MCP Claude Desktop에서 사용하기
Smithery에 배포한 MCP 서버를 Claude Desktop에서 사용하기 위해서 `Overview` 탭에서 클라이언트를 선택한다.

![smithery-overview](./markdown/create-mcp-server-with-smithery/7.png)

터미널을 통해 커맨드를 입력한다.

![smithery-terminal](./markdown/create-mcp-server-with-smithery/8.png)

설치 후 Claude Desktop을 재시작하면 MCP 서버가 자동으로 추가된다.

![smithery-claude-desktop](./markdown/create-mcp-server-with-smithery/9.png)

테스트 결과 의도한대로 잘 작동하는 것을 확인할 수 있다.

![smithery-claude-desktop-test](./markdown/create-mcp-server-with-smithery/10.png)

## 참고

[Smithery Takeoff MCP Server](https://smithery.ai/server/@windopper/mcp-takeoff)

[MCP Takeoff Github Repository](https://github.com/windopper/mcp-takeoff)