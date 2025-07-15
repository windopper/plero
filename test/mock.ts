import { v4 } from "uuid";
import type { User, Wiki, FavoritesList, FavoritesItem, WikiContributor, WikiHistory } from "~/server/db/schema";
import { deleteUser, setUser } from "~/server/db/user";
import { setWiki, deleteWiki } from "~/server/db/wiki";
import { createFavoritesList, deleteFavoritesList } from "~/server/db/favoritesList";
import { removeAllItemsFromList } from "~/server/db/favoritesItem";
import { deleteWikiContributor, setWikiContributor } from "~/server/db/wikiContributor";
import { deleteWikiHistory, setWikiHistory } from "~/server/db/wikiHistory";

export const getMockUser = ({ id }: { id: string }): User => {
  return {
    id,
    provider: "email",
    email: `${id}@example.com`,
    name: `Test User ${id}`,
    role: "editor",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    loginCount: 0,
    preferences: {
      theme: "auto",
      language: "ko",
      notifications: true,
      emailNotifications: false,
    },
    avatar: null,
    displayName: null,
    bio: null,
    lastLoginAt: null,
    metadata: {},
  };
};

export const createMockUsers = async ({ count = 5 }: { count?: number } = {}) => {
  const users: User[] = [];
  for (let i = 0; i < count; i++) {
    const user = await setUser({
      provider: "email",
      email: `${v4()}@example.com`,
      name: `Test User ${i}`,
      role: "editor",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      loginCount: 0,
      preferences: {
        theme: "auto",
        language: "ko",
        notifications: true,
        emailNotifications: false,
      },
      avatar: null,
      displayName: null,
      bio: null,
      lastLoginAt: null,
      metadata: {},
    });
    if (user.success) {
      users.push(user.data);
    }
  }

  const cleanUpUsers = async () => {
    for (const user of users) {
      await deleteUser(user.id);
    }
  }

  return { users, cleanUpUsers };
}

// Wiki 관련 헬퍼 수정
export const createMockWiki = async (overrides: Partial<Omit<Wiki, 'id'>> = {}) => {
  const { users, cleanUpUsers } = await createMockUsers({ count: 1 });
  const mockUser = users[0];

  if (!mockUser) {
    throw new Error('Failed to create mock user for wiki');
  }

  const defaultWiki: Omit<Wiki, 'id'> = {
    title: 'Test Wiki',
    content: 'This is test content',
    authorId: mockUser.id,
    authorName: mockUser.name,
    authorEmail: mockUser.email,
    lastEditor: mockUser.id,
    lastEditorName: mockUser.name,
    lastEditorEmail: mockUser.email,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
    latestVersion: 1,
    isPublished: true,
    tags: ['test'],
  };

  const wikiData = { ...defaultWiki, ...overrides };
  const setResult = await setWiki(wikiData);
  if (!setResult.success) {
    await cleanUpUsers();
    throw new Error('Failed to create mock wiki');
  }
  const wiki = setResult.data;

  const cleanUpWiki = async () => {
    await deleteWiki(wiki.id);
    await cleanUpUsers();
  };

  return { wiki, mockUser, cleanUpWiki };
};

// FavoritesList 관련 헬퍼 - 변경 없음
export const createMockFavoritesList = async (overrides: Partial<Omit<FavoritesList, 'id' | 'createdAt' | 'updatedAt'>> = {}) => {
  const { users, cleanUpUsers } = await createMockUsers({ count: 1 });
  const mockUser = users[0];

  if (!mockUser) {
    throw new Error('Failed to create mock user for favorites list');
  }

  const defaultList: Omit<FavoritesList, 'id' | 'createdAt' | 'updatedAt'> = {
    userId: mockUser.id,
    name: 'Test Favorites List',
    description: 'Test favorites list description',
    isDefault: false,
    sortOrder: 1,
    color: '#ff6b6b',
  };

  const listData = { ...defaultList, ...overrides };
  const createResult = await createFavoritesList(listData);
  if (!createResult.success) {
    await cleanUpUsers();
    throw new Error('Failed to create mock favorites list');
  }
  const favoritesList = createResult.data;

  const cleanUpFavoritesList = async () => {
    await removeAllItemsFromList(favoritesList.id);
    await deleteFavoritesList(favoritesList.id);
    await cleanUpUsers();
  };

  return { favoritesList, mockUser, cleanUpFavoritesList };
};

// WikiContributor 관련 헬퍼 수정 - 실제 Wiki와 User 생성
export const createMockWikiContributor = async (overrides: Partial<Omit<WikiContributor, 'id'>> = {}) => {
  const { wiki, mockUser, cleanUpWiki } = await createMockWiki();

  const defaultContributor: Omit<WikiContributor, 'id'> = {
    wikiId: wiki.id,
    contributorId: mockUser.id,
    contributorName: mockUser.name,
    contributorEmail: mockUser.email,
    contributedAt: new Date(),
    firstContributedAt: new Date(),
    linesAdded: 0,
    linesRemoved: 0,
  };

  const contributorData = { ...defaultContributor, ...overrides };

  const cleanUpWikiContributor = async (contributorId?: string) => {
    if (contributorId) {
      await deleteWikiContributor(contributorId);
    }
    await cleanUpWiki();
  };

  return { contributorData, mockUser, wiki, cleanUpWikiContributor };
};

// WikiHistory 관련 헬퍼 수정 - 실제 Wiki와 User 생성
export const createMockWikiHistory = async (overrides: Partial<Omit<WikiHistory, 'id'>> = {}) => {
  const { wiki, mockUser, cleanUpWiki } = await createMockWiki();

  const defaultHistory: Omit<WikiHistory, 'id'> = {
    wikiId: wiki.id,
    version: 1,
    title: 'Test Wiki History',
    content: 'Test content',
    changeMessage: 'Initial creation',
    changeType: 'create',
    changedBy: mockUser.id,
    changedByName: mockUser.name,
    changedByEmail: mockUser.email,
    changedAt: new Date(),
    previousVersion: null,
    parentVersions: [],
    contentSize: 12, // 'Test content'.length
    contentHash: 'test-hash',
    isMinor: false,
    tags: ['test'],
    metadata: {},
    addedCharacters: 12,
    removedCharacters: 0,
    addedTags: ['test'],
    removedTags: [],
  };

  const historyData = { ...defaultHistory, ...overrides };

  const cleanUpWikiHistory = async (historyId?: string) => {
    if (historyId) {
      await deleteWikiHistory(historyId);
    }
    await cleanUpWiki();
  };

  return { historyData, mockUser, wiki, cleanUpWikiHistory };
};