import { setup, type TestOptions } from "@nuxt/test-utils";

export const setupNuxt = (options?: Partial<TestOptions>) => {
  return setup({
    build: false,
    buildDir: ".output",
    nuxtConfig: {
      nitro: {
        output: {
          dir: ".output",
        },
      },
    },
    ...options,
  });
};

// 테스트 환경 설정
process.env.NODE_ENV = "test";
process.env.NUXT_TEST_MODE = "true";
process.env.BYPASS_AUTH = "true";

// Content 모듈 관련 문제 해결을 위한 환경 변수
process.env.NUXT_CONTENT_DATABASE_REFRESH = "false";
