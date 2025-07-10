import type { H3Event } from 'h3'
import type { User } from '../db/schema'
import { v4 } from 'uuid'

/**
 * 테스트 환경에서 사용할 모킹된 사용자 정보
 */
export const getTestUser = (): User => {
  return {
    id: v4(),
    provider: 'email',
    email: 'test@example.com',
    name: 'Test User',
    role: 'editor',
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    loginCount: 0,
    preferences: {
      theme: 'auto',
      language: 'ko',
      notifications: true,
      emailNotifications: false,
    },
  }
}

/**
 * 테스트 환경인지 확인하는 함수
 */
export const isTestEnvironment = (): boolean => {
  return process.env.NODE_ENV === 'test' || process.env.NUXT_TEST_MODE === 'true'
}

/**
 * 테스트 환경에서 인증을 우회하는 함수
 */
export const requireUserSessionForTest = async (event: H3Event) => {
  if (isTestEnvironment()) {
    return {
      user: getTestUser()
    }
  }
  
  return requireUserSession(event)
} 