import { 
    pgTable, 
    uuid, 
    varchar, 
    text, 
    timestamp, 
    integer, 
    boolean, 
    jsonb,
    primaryKey,
    foreignKey,
    index,
    unique
  } from 'drizzle-orm/pg-core';
  import { relations, sql } from 'drizzle-orm';

  // TEST 테이블
  export const TEST_SCHEMA = pgTable('test', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  });
  
  // Users 테이블
  export const USER_SCHEMA = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    provider: varchar('provider', { length: 20 }).notNull().default('email'),
    email: varchar('email', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 100 }).notNull(),
    avatar: text('avatar'),
    displayName: varchar('display_name', { length: 100 }),
    bio: text('bio'),
    role: varchar('role', { length: 20 }).notNull().default('editor'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    lastLoginAt: timestamp('last_login_at'),
    loginCount: integer('login_count').notNull().default(0),
    preferences: jsonb('preferences').$type<{
      theme: 'auto' | 'light' | 'dark';
      language: 'ko' | 'en';
      notifications: boolean;
      emailNotifications: boolean;
    }>().notNull().default({
      theme: 'auto',
      language: 'ko',
      notifications: true,
      emailNotifications: false
    }),
    metadata: jsonb('metadata'),
  }, (table) => ({
    emailIdx: index('users_email_idx').on(table.email),
    roleIdx: index('users_role_idx').on(table.role),
    providerIdx: index('users_provider_idx').on(table.provider),
  }));
  
  // Wikis 테이블
  export const WIKI_SCHEMA = pgTable('wikis', {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 200 }).notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    version: integer('version').notNull().default(1),
    latestVersion: integer('latest_version').notNull().default(0),
    authorId: uuid('author_id').notNull().references(() => USER_SCHEMA.id, { onDelete: 'cascade' }),
    authorName: varchar('author_name', { length: 100 }).notNull(),
    authorEmail: varchar('author_email', { length: 255 }).notNull(),
    lastEditor: uuid('last_editor').notNull().references(() => USER_SCHEMA.id, { onDelete: 'cascade' }),
    lastEditorName: varchar('last_editor_name', { length: 100 }).notNull(),
    lastEditorEmail: varchar('last_editor_email', { length: 255 }).notNull(),
    isPublished: boolean('is_published').notNull().default(true),
    tags: jsonb('tags').$type<string[]>().notNull().default([]),
  }, (table) => ({
    titleIdx: index('wikis_title_idx').on(table.title),
    authorIdx: index('wikis_author_idx').on(table.authorId),
    lastEditorIdx: index('wikis_last_editor_idx').on(table.lastEditor),
    publishedIdx: index('wikis_published_idx').on(table.isPublished),
    createdAtIdx: index('wikis_created_at_idx').on(table.createdAt),
    updatedAtIdx: index('wikis_updated_at_idx').on(table.updatedAt),
  }));
  
  // Wiki Contributors 테이블
  export const WIKI_CONTRIBUTORS_SCHEMA = pgTable('wiki_contributors', {
    id: uuid('id').primaryKey().defaultRandom(),
    wikiId: uuid('wiki_id').notNull().references(() => WIKI_SCHEMA.id, { onDelete: 'cascade' }),
    contributorId: uuid('contributor_id').notNull().references(() => USER_SCHEMA.id, { onDelete: 'cascade' }),
    contributorName: varchar('contributor_name', { length: 100 }).notNull(),
    contributorEmail: varchar('contributor_email', { length: 255 }).notNull(),
    contributedAt: timestamp('contributed_at').notNull().defaultNow(),
    firstContributedAt: timestamp('first_contributed_at').notNull().defaultNow(),
    linesAdded: integer('lines_added').notNull().default(0),
    linesRemoved: integer('lines_removed').notNull().default(0),
  }, (table) => ({
    wikiContributorIdx: index('wiki_contributors_wiki_contributor_idx').on(table.wikiId, table.contributorId),
    contributorIdx: index('wiki_contributors_contributor_idx').on(table.contributorId),
    wikiIdx: index('wiki_contributors_wiki_idx').on(table.wikiId),
    // 한 위키에 한 기여자는 하나의 레코드만 존재해야 함
    wikiContributorUnique: unique('wiki_contributors_wiki_contributor_unique').on(table.wikiId, table.contributorId),
  }));
  
  // Wiki History 테이블
  export const WIKI_HISTORY_SCHEMA = pgTable('wiki_history', {
    id: uuid('id').primaryKey().defaultRandom(),
    wikiId: uuid('wiki_id').notNull().references(() => WIKI_SCHEMA.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    title: varchar('title', { length: 200 }).notNull(),
    content: text('content').notNull(),
    changeMessage: varchar('change_message', { length: 500 }).notNull().default(''),
    changeType: varchar('change_type', { length: 20 }).notNull(),
    changedBy: uuid('changed_by').notNull().references(() => USER_SCHEMA.id, { onDelete: 'cascade' }),
    changedByName: varchar('changed_by_name', { length: 100 }).notNull(),
    changedByEmail: varchar('changed_by_email', { length: 255 }).notNull(),
    changedAt: timestamp('changed_at').notNull().defaultNow(),
    previousVersion: uuid('previous_version'),
    parentVersions: jsonb('parent_versions').notNull().default([]),
    contentSize: integer('content_size').notNull().default(0),
    contentHash: varchar('content_hash', { length: 64 }).notNull(),
    addedCharacters: integer('added_characters').notNull().default(0),
    removedCharacters: integer('removed_characters').notNull().default(0),
    isMinor: boolean('is_minor').notNull().default(false),
    tags: jsonb('tags').$type<string[]>().notNull().default([]),
    addedTags: jsonb('added_tags').$type<string[]>().notNull().default([]),
    removedTags: jsonb('removed_tags').$type<string[]>().notNull().default([]),
    metadata: jsonb('metadata'),
  }, (table) => ({
    wikiVersionIdx: index('wiki_history_wiki_version_idx').on(table.wikiId, table.version),
    wikiIdx: index('wiki_history_wiki_idx').on(table.wikiId),
    changedByIdx: index('wiki_history_changed_by_idx').on(table.changedBy),
    changedAtIdx: index('wiki_history_changed_at_idx').on(table.changedAt),
    changeTypeIdx: index('wiki_history_change_type_idx').on(table.changeType),
    // 한 위키의 특정 버전은 유일해야 함
    wikiVersionUnique: unique('wiki_history_wiki_version_unique').on(table.wikiId, table.version),
  }));
  
  // Favorites Lists 테이블
  export const FAVORITES_LIST_SCHEMA = pgTable('favorites_lists', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => USER_SCHEMA.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    description: varchar('description', { length: 500 }),
    color: varchar('color', { length: 7 }), // hex color code
    isDefault: boolean('is_default').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    sortOrder: integer('sort_order').notNull().default(0),
  }, (table) => ({
    userIdx: index('favorites_lists_user_idx').on(table.userId),
    userNameIdx: index('favorites_lists_user_name_idx').on(table.userId, table.name),
    sortOrderIdx: index('favorites_lists_sort_order_idx').on(table.sortOrder),
  }));
  
  // Favorites Items 테이블
  export const FAVORITES_ITEM_SCHEMA = pgTable('favorites_items', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => USER_SCHEMA.id, { onDelete: 'cascade' }),
    wikiId: uuid('wiki_id').notNull().references(() => WIKI_SCHEMA.id, { onDelete: 'cascade' }),
    listId: uuid('list_id').notNull().references(() => FAVORITES_LIST_SCHEMA.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    note: varchar('note', { length: 200 }).default(''),
  }, (table) => ({
    userWikiListIdx: index('favorites_items_user_wiki_list_idx').on(table.userId, table.wikiId, table.listId),
    userIdx: index('favorites_items_user_idx').on(table.userId),
    wikiIdx: index('favorites_items_wiki_idx').on(table.wikiId),
    listIdx: index('favorites_items_list_idx').on(table.listId),
    // 같은 위키가 같은 목록에 중복 저장되지 않도록
    wikiListUnique: unique('favorites_items_wiki_list_unique').on(table.wikiId, table.listId),
  }));
  
  // Relations 정의
  export const usersRelations = relations(USER_SCHEMA, ({ many }) => ({
    authoredWikis: many(WIKI_SCHEMA, { relationName: 'author' }),
    editedWikis: many(WIKI_SCHEMA, { relationName: 'lastEditor' }),
    contributions: many(WIKI_CONTRIBUTORS_SCHEMA),
    historyEntries: many(WIKI_HISTORY_SCHEMA),
    favoritesLists: many(FAVORITES_LIST_SCHEMA),
    favoritesItems: many(FAVORITES_ITEM_SCHEMA),
  }));
  
  export const wikisRelations = relations(WIKI_SCHEMA, ({ one, many }) => ({
    author: one(USER_SCHEMA, {
      fields: [WIKI_SCHEMA.authorId],
      references: [USER_SCHEMA.id],
      relationName: 'author',
    }),
    lastEditor: one(USER_SCHEMA, {
      fields: [WIKI_SCHEMA.lastEditor],
      references: [USER_SCHEMA.id],
      relationName: 'lastEditor',
    }),
    contributors: many(WIKI_CONTRIBUTORS_SCHEMA),
    history: many(WIKI_HISTORY_SCHEMA),
    favoritesItems: many(FAVORITES_ITEM_SCHEMA),
  }));
  
  export const wikiContributorsRelations = relations(WIKI_CONTRIBUTORS_SCHEMA, ({ one }) => ({
    wiki: one(WIKI_SCHEMA, {
      fields: [WIKI_CONTRIBUTORS_SCHEMA.wikiId],
      references: [WIKI_SCHEMA.id],
    }),
    contributor: one(USER_SCHEMA, {
      fields: [WIKI_CONTRIBUTORS_SCHEMA.contributorId],
      references: [USER_SCHEMA.id],
    }),
  }));
  
  export const wikiHistoryRelations = relations(WIKI_HISTORY_SCHEMA, ({ one }) => ({
    wiki: one(WIKI_SCHEMA, {
      fields: [WIKI_HISTORY_SCHEMA.wikiId],
      references: [WIKI_SCHEMA.id],
    }),
    changedBy: one(USER_SCHEMA, {
      fields: [WIKI_HISTORY_SCHEMA.changedBy],
      references: [USER_SCHEMA.id],
    }),
  }));
  
  export const favoritesListsRelations = relations(FAVORITES_LIST_SCHEMA, ({ one, many }) => ({
    user: one(USER_SCHEMA, {
      fields: [FAVORITES_LIST_SCHEMA.userId],
      references: [USER_SCHEMA.id],
    }),
    items: many(FAVORITES_ITEM_SCHEMA),
  }));
  
  export const favoritesItemsRelations = relations(FAVORITES_ITEM_SCHEMA, ({ one }) => ({
    user: one(USER_SCHEMA, {
      fields: [FAVORITES_ITEM_SCHEMA.userId],
      references: [USER_SCHEMA.id],
    }),
    wiki: one(WIKI_SCHEMA, {
      fields: [FAVORITES_ITEM_SCHEMA.wikiId],
      references: [WIKI_SCHEMA.id],
    }),
    list: one(FAVORITES_LIST_SCHEMA, {
      fields: [FAVORITES_ITEM_SCHEMA.listId],
      references: [FAVORITES_LIST_SCHEMA.id],
    }),
  }));
  
  // 타입 추출
  export type User = typeof USER_SCHEMA.$inferSelect;
  export type NewUser = typeof USER_SCHEMA.$inferInsert;
  
  export type Wiki = typeof WIKI_SCHEMA.$inferSelect;
  export type NewWiki = typeof WIKI_SCHEMA.$inferInsert;
  
  export type WikiContributor = typeof WIKI_CONTRIBUTORS_SCHEMA.$inferSelect;
  export type NewWikiContributor = typeof WIKI_CONTRIBUTORS_SCHEMA.$inferInsert;
  
  export type WikiHistory = typeof WIKI_HISTORY_SCHEMA.$inferSelect;
  export type NewWikiHistory = typeof WIKI_HISTORY_SCHEMA.$inferInsert;
  
  export type FavoritesList = typeof FAVORITES_LIST_SCHEMA.$inferSelect;
  export type NewFavoritesList = typeof FAVORITES_LIST_SCHEMA.$inferInsert;
  
  export type FavoritesItem = typeof FAVORITES_ITEM_SCHEMA.$inferSelect;
  export type NewFavoritesItem = typeof FAVORITES_ITEM_SCHEMA.$inferInsert; 