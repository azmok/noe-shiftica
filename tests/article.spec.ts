import { test, expect } from '@playwright/test';
import { getTestPayload } from './helpers';

/**
 * Integration test for Article CRUD operations using Payload Local API.
 * This test runs against the database directly via Payload.
 */
test.describe('Article Integration (Local API)', () => {
  let payload: any;
  let createdPostId: string | number;

  test.beforeAll(async () => {
    try {
      console.log('--- article.spec.ts: calling getTestPayload ---');
      payload = await getTestPayload();
      console.log('--- article.spec.ts: payload ready ---');
    } catch (err: any) {
      console.error('--- article.spec.ts: payload initialization FAILED ---');
      console.error(err);
      throw err;
    }
  });

  test.afterAll(async () => {
    // Cleanup: Ensure the test post is deleted if it still exists
    if (createdPostId && payload) {
      try {
        await payload.delete({
          collection: 'posts',
          id: createdPostId,
        });
      } catch (e) {
        // Ignore if already deleted
      }
    }
  });

  test('should create, find, and delete an article via Local API', async () => {
    const testTitle = `Playwright Test Post ${Date.now()}`;
    const testSlug = `playwright-test-post-${Date.now()}`;

    // 1. Create Article
    const post = await test.step('Create article', async () => {
      return await payload.create({
        collection: 'posts',
        data: {
          title: testTitle,
          slug: testSlug,
          _status: 'draft',
          content: {
            root: {
              children: [
                {
                  children: [{ detail: 0, format: 0, mode: 'normal', style: '', text: 'Test content', type: 'text', version: 1 }],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  type: 'paragraph',
                  version: 1,
                },
              ],
              direction: 'ltr',
              format: '',
              indent: 0,
              type: 'root',
              version: 1,
            },
          },
        },
      });
    });

    expect(post).toBeDefined();
    expect(post.title).toBe(testTitle);
    createdPostId = post.id;

    // 2. Read Article
    await test.step('Find article by ID', async () => {
      const fetchedPost = await payload.findByID({
        collection: 'posts',
        id: createdPostId,
      });
      expect(fetchedPost.id).toBe(createdPostId);
      expect(fetchedPost.title).toBe(testTitle);
    });

    // 3. Delete Article
    await test.step('Delete article', async () => {
      const deletedPost = await payload.delete({
        collection: 'posts',
        id: createdPostId,
      });
      expect(deletedPost.id).toBe(createdPostId);
      createdPostId = ''; // Clear ID so afterAll doesn't try to delete it again
    });
  });
});
