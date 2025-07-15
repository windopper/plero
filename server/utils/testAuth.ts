import type { H3Event } from 'h3'
import type { User } from '../db/schema'
import { getUser, setUser } from '../db/user'

// 고정된 테스트 사용자 ID
const TEST_USER_ID = 'test-user-12345678-1234-1234-1234-123456789012'

/**
 * 테스트 환경에서 사용할 모킹된 사용자 정보
 */
export const getTestUser = async (): Promise<User> => {
  // 먼저 데이터베이스에서 테스트 사용자 확인
  const existingUser = await getUser(TEST_USER_ID)
  
  if (existingUser.success) {
    return existingUser.data
  }

  // 사용자가 없으면 생성
  const newUser = {
    id: TEST_USER_ID,
    provider: 'email',
    email: 'test@example.com',
    name: 'Test User',
    role: 'editor' as const,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    loginCount: 0,
    preferences: {
      theme: 'auto' as const,
      language: 'ko' as const,
      notifications: true,
      emailNotifications: false,
    },
    avatar: null,
    displayName: null,
    bio: null,
    lastLoginAt: null,
    metadata: {},
  }

  const createResult = await setUser(newUser)
  if (createResult.success) {
    return createResult.data
  }

  // 생성 실패 시 기본값 반환 (이미 존재할 수 있음)
  return newUser
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
    const user = await getTestUser()
    return { user }
  }
  
  return requireUserSession(event)
} 