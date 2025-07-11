import { z } from "zod";

// User 스키마 - Google OAuth 연동을 고려한 사용자 정보
export const USER_SCHEMA = z.object({
    id: z.string().uuid(), // Primary key - UUID
    provider: z.enum(["google", "github", "email"]).default("email"), // 로그인 제공자
    email: z.string().email(), // 이메일 (unique)
    name: z.string(), // 사용자 이름
    avatar: z.string().url().optional(), // 프로필 이미지 URL
    displayName: z.string().optional(), // 표시용 이름 (nickname)
    bio: z.string().max(500).optional(), // 자기소개
    role: z.enum(["admin", "editor", "viewer"]).default("editor"), // 사용자 권한
    isActive: z.boolean().default(true), // 계정 활성화 상태
    createdAt: z.number(), // 계정 생성 시간
    updatedAt: z.number(), // 마지막 정보 수정 시간
    lastLoginAt: z.number().optional(), // 마지막 로그인 시간
    loginCount: z.number().int().min(0).default(0), // 로그인 횟수
    preferences: z.object({
        theme: z.enum(["light", "dark", "auto"]).default("auto"),
        language: z.string().default("ko"),
        notifications: z.boolean().default(true),
        emailNotifications: z.boolean().default(false),
    }).default({}), // 사용자 설정
    metadata: z.record(z.string(), z.any()).optional(), // 추가 메타데이터
})

// Wiki 메인 스키마 - UUID를 primary key로 사용, title은 검색용
export const WIKI_SCHEMA = z.object({
    id: z.string().uuid(), // Primary key - UUID
    title: z.string().min(1).max(200), // 검색용 제목
    content: z.string(), // 현재 위키 내용
    createdAt: z.number(), // 생성 시간 (timestamp)
    updatedAt: z.number(), // 마지막 수정 시간 (timestamp)
    version: z.number().int().positive(), // 현재 버전 번호
    latestVersion: z.number().int().default(0), // 최신 버전 번호
    authorId: z.string(), // 생성자 고유 ID
    authorName: z.string(), // 생성자 이름
    authorEmail: z.string().email(), // 생성자 이메일
    lastEditor: z.string(), // 마지막 수정자 ID
    lastEditorName: z.string(), // 마지막 수정자 이름
    lastEditorEmail: z.string().email(), // 마지막 수정자 이메일
    isPublished: z.boolean().default(true), // 공개 여부
    tags: z.array(z.string()).default([]), // 태그 배열
})

// 기여자 스키마 - 한 위키에 여러 기여자가 있을 수 있음
export const WIKI_CONTRIBUTORS_SCHEMA = z.object({
    id: z.string().uuid(), // Primary key
    wikiId: z.string().uuid(), // Foreign key to Wiki
    contributorId: z.string().uuid(), // Foreign key to User
    contributorName: z.string(), // 기여자 이름
    contributorEmail: z.string().email(), // 기여자 이메일
    contributedAt: z.number(), // 기여 시간 (timestamp)
    firstContributedAt: z.number().default(Date.now()), // 최초 기여 시간 (timestamp)
    linesAdded: z.number().int().default(0), // 추가된 라인 수
    linesRemoved: z.number().int().default(0), // 삭제된 라인 수
})

// 히스토리 스키마 - Full Snapshot 방식으로 각 버전의 전체 내용 저장
export const WIKI_HISTORY_SCHEMA = z.object({
    id: z.string().uuid(), // Primary key
    wikiId: z.string().uuid(), // Foreign key to Wiki
    version: z.number().int().positive(), // 버전 번호
    title: z.string(), // 해당 버전의 제목
    content: z.string(), // 해당 버전의 전체 내용 (Full Snapshot)
    changeMessage: z.string().max(500).default(""), // 변경 사유/메시지
    changeType: z.enum([
        "create",
        "edit", 
        "revert",
        "merge",
        "delete",
        "restore"
    ]), // 변경 유형
    changedBy: z.string().uuid(), // Foreign key to User
    changedByName: z.string(), // 변경자 이름
    changedByEmail: z.string().email(), // 변경자 이메일
    changedAt: z.number(), // 변경 시간 (timestamp)
    previousVersion: z.string().uuid().nullable(), // 이전 버전 (되돌리기 추적용)
    parentVersions: z.array(z.string().uuid()).default([]), // 부모 버전들 (merge 지원)
    contentSize: z.number().int().min(0), // 내용 크기 (통계/최적화용)
    contentHash: z.string(), // 내용 해시 (중복 제거/무결성 검증용)
    addedCharacters: z.number().int().min(0).default(0), // 추가된 문자 수
    removedCharacters: z.number().int().min(0).default(0), // 삭제된 문자 수
    isMinor: z.boolean().default(false), // 사소한 수정 여부
    tags: z.array(z.string()).default([]), // 해당 버전의 태그
    addedTags: z.array(z.string()).default([]), // 추가된 태그
    removedTags: z.array(z.string()).default([]), // 삭제된 태그
    metadata: z.record(z.string(), z.any()).optional(), // 추가 메타데이터
})

// 즐겨찾기 목록 스키마 - 사용자가 생성한 즐겨찾기 폴더
export const FAVORITES_LIST_SCHEMA = z.object({
    id: z.string().uuid(), // Primary key - UUID
    userId: z.string().uuid(), // Foreign key to User
    name: z.string().min(1).max(100), // 즐겨찾기 목록 이름
    description: z.string().max(500).optional(), // 즐겨찾기 목록 설명
    color: z.string().optional(), // 목록 색상 (hex code)
    isDefault: z.boolean().default(false), // 기본 목록 여부
    createdAt: z.number(), // 생성 시간 (timestamp)
    updatedAt: z.number(), // 마지막 수정 시간 (timestamp)
    sortOrder: z.number().int().default(0), // 정렬 순서
})

// 즐겨찾기 아이템 스키마 - 특정 위키가 특정 즐겨찾기 목록에 포함됨
export const FAVORITES_ITEM_SCHEMA = z.object({
    id: z.string().uuid(), // Primary key - UUID
    userId: z.string().uuid(), // Foreign key to User
    wikiId: z.string().uuid(), // Foreign key to Wiki
    listId: z.string().uuid(), // Foreign key to FavoritesList
    createdAt: z.number(), // 즐겨찾기 추가 시간 (timestamp)
    note: z.string().max(200).optional(), // 개인 메모
})

// 타입 추출
export type User = z.infer<typeof USER_SCHEMA>;
export type Wiki = z.infer<typeof WIKI_SCHEMA>;
export type WikiContributor = z.infer<typeof WIKI_CONTRIBUTORS_SCHEMA>;
export type WikiHistory = z.infer<typeof WIKI_HISTORY_SCHEMA>;
export type FavoritesList = z.infer<typeof FAVORITES_LIST_SCHEMA>;
export type FavoritesItem = z.infer<typeof FAVORITES_ITEM_SCHEMA>;

// 관계 정의를 위한 추가 타입들
export type WikiWithContributors = Wiki & {
    contributors: WikiContributor[];
};

export type WikiWithHistory = Wiki & {
    history: WikiHistory[];
};

export type WikiFull = Wiki & {
    contributors: WikiContributor[];
    history: WikiHistory[];
};

// 즐겨찾기 관련 타입들
export type FavoritesListWithItems = FavoritesList & {
    items: FavoritesItem[];
};

export type WikiWithFavorites = Wiki & {
    favoritesCount: number;
    isFavorited: boolean;
    favoritesLists: FavoritesList[];
};