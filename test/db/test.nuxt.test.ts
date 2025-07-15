import { describe, it, expect } from "vitest";
import { db } from "~/server/db";
import { TEST_SCHEMA } from "~/server/db/schema";

describe('test', () => {
    it('should create a test', async () => {
        const test = await db.insert(TEST_SCHEMA).values({ name: 'test', createdAt: new Date() });
        expect(test).toBeDefined();
    });
});
