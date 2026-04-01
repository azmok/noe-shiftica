# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: article.spec.ts >> Article Integration (Local API) >> should create, find, and delete an article via Local API
- Location: tests\article.spec.ts:38:3

# Error details

```
Error: Error: cannot connect to Postgres: SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { getTestPayload } from './helpers';
  3  | 
  4  | /**
  5  |  * Integration test for Article CRUD operations using Payload Local API.
  6  |  * This test runs against the database directly via Payload.
  7  |  */
  8  | test.describe('Article Integration (Local API)', () => {
  9  |   let payload: any;
  10 |   let createdPostId: string | number;
  11 | 
  12 |   test.beforeAll(async () => {
  13 |     try {
  14 |       console.log('--- article.spec.ts: calling getTestPayload ---');
> 15 |       payload = await getTestPayload();
     |                 ^ Error: Error: cannot connect to Postgres: SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string
  16 |       console.log('--- article.spec.ts: payload ready ---');
  17 |     } catch (err: any) {
  18 |       console.error('--- article.spec.ts: payload initialization FAILED ---');
  19 |       console.error(err);
  20 |       throw err;
  21 |     }
  22 |   });
  23 | 
  24 |   test.afterAll(async () => {
  25 |     // Cleanup: Ensure the test post is deleted if it still exists
  26 |     if (createdPostId && payload) {
  27 |       try {
  28 |         await payload.delete({
  29 |           collection: 'posts',
  30 |           id: createdPostId,
  31 |         });
  32 |       } catch (e) {
  33 |         // Ignore if already deleted
  34 |       }
  35 |     }
  36 |   });
  37 | 
  38 |   test('should create, find, and delete an article via Local API', async () => {
  39 |     const testTitle = `Playwright Test Post ${Date.now()}`;
  40 |     const testSlug = `playwright-test-post-${Date.now()}`;
  41 | 
  42 |     // 1. Create Article
  43 |     const post = await test.step('Create article', async () => {
  44 |       return await payload.create({
  45 |         collection: 'posts',
  46 |         data: {
  47 |           title: testTitle,
  48 |           slug: testSlug,
  49 |           _status: 'draft',
  50 |           content: {
  51 |             root: {
  52 |               children: [
  53 |                 {
  54 |                   children: [{ detail: 0, format: 0, mode: 'normal', style: '', text: 'Test content', type: 'text', version: 1 }],
  55 |                   direction: 'ltr',
  56 |                   format: '',
  57 |                   indent: 0,
  58 |                   type: 'paragraph',
  59 |                   version: 1,
  60 |                 },
  61 |               ],
  62 |               direction: 'ltr',
  63 |               format: '',
  64 |               indent: 0,
  65 |               type: 'root',
  66 |               version: 1,
  67 |             },
  68 |           },
  69 |         },
  70 |       });
  71 |     });
  72 | 
  73 |     expect(post).toBeDefined();
  74 |     expect(post.title).toBe(testTitle);
  75 |     createdPostId = post.id;
  76 | 
  77 |     // 2. Read Article
  78 |     await test.step('Find article by ID', async () => {
  79 |       const fetchedPost = await payload.findByID({
  80 |         collection: 'posts',
  81 |         id: createdPostId,
  82 |       });
  83 |       expect(fetchedPost.id).toBe(createdPostId);
  84 |       expect(fetchedPost.title).toBe(testTitle);
  85 |     });
  86 | 
  87 |     // 3. Delete Article
  88 |     await test.step('Delete article', async () => {
  89 |       const deletedPost = await payload.delete({
  90 |         collection: 'posts',
  91 |         id: createdPostId,
  92 |       });
  93 |       expect(deletedPost.id).toBe(createdPostId);
  94 |       createdPostId = ''; // Clear ID so afterAll doesn't try to delete it again
  95 |     });
  96 |   });
  97 | });
  98 | 
```