# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> admin login flow redirects to dashboard
- Location: tests\auth.spec.ts:6:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('nav')
Expected: visible
Error: strict mode violation: locator('nav') resolved to 2 elements:
    1) <nav class="nav__wrap">…</nav> aka getByRole('navigation').filter({ hasText: 'CollectionsUsersMediaCategoriesPosts埋め込みHTMLファイル' })
    2) <nav class="step-nav app-header__step-nav">…</nav> aka getByText('/Dashboard')

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('nav')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - button "Open Menu" [ref=e6] [cursor=pointer]:
      - generic "Open" [ref=e8]:
        - img [ref=e9]
    - generic [ref=e11]:
      - complementary [ref=e12]:
        - navigation [ref=e14]:
          - generic [ref=e15]:
            - button "Collections" [ref=e16] [cursor=pointer]:
              - generic [ref=e17]: Collections
              - img [ref=e19]
            - generic [ref=e23]:
              - link "Users" [ref=e24] [cursor=pointer]:
                - /url: /admin/collections/users
                - generic [ref=e25]: Users
              - link "Media" [ref=e26] [cursor=pointer]:
                - /url: /admin/collections/media
                - generic [ref=e27]: Media
              - link "Categories" [ref=e28] [cursor=pointer]:
                - /url: /admin/collections/categories
                - generic [ref=e29]: Categories
              - link "Posts" [ref=e30] [cursor=pointer]:
                - /url: /admin/collections/posts
                - generic [ref=e31]: Posts
              - link "埋め込みHTMLファイル" [ref=e32] [cursor=pointer]:
                - /url: /admin/collections/html-files
                - generic [ref=e33]: 埋め込みHTMLファイル
          - link "Log out" [ref=e35] [cursor=pointer]:
            - /url: /admin/logout
            - img [ref=e36]
      - generic [ref=e40]:
        - banner [ref=e41]:
          - generic [ref=e44]:
            - navigation [ref=e46]:
              - link [ref=e47] [cursor=pointer]:
                - /url: /admin
                - generic "Dashboard" [ref=e48]:
                  - img [ref=e49]
              - generic [ref=e52]: /
              - generic [ref=e54]:
                - log [ref=e56]
                - generic [ref=e57] [cursor=pointer]:
                  - generic "Dashboard" [ref=e58]:
                    - generic [ref=e59]:
                      - generic [ref=e60]: Dashboard
                      - combobox [ref=e61]
                  - button [ref=e63]:
                    - img [ref=e64]
            - link "Account" [ref=e66] [cursor=pointer]:
              - /url: /admin/account
              - img "yas" [ref=e67]
        - generic [ref=e70]:
          - generic [ref=e78]:
            - heading "Collections" [level=2] [ref=e79]
            - list [ref=e80]:
              - listitem [ref=e81]:
                - generic [ref=e82] [cursor=pointer]:
                  - heading "Users" [level=3] [ref=e83]
                  - link "Create new Users" [ref=e85]:
                    - /url: /admin/collections/users/create
                    - generic:
                      - generic:
                        - img
                  - link "Show all Users" [ref=e86]:
                    - /url: /admin/collections/users
              - listitem [ref=e87]:
                - generic [ref=e88] [cursor=pointer]:
                  - heading "Media" [level=3] [ref=e89]
                  - link "Create new Media" [ref=e91]:
                    - /url: /admin/collections/media/create
                    - generic:
                      - generic:
                        - img
                  - link "Show all Media" [ref=e92]:
                    - /url: /admin/collections/media
              - listitem [ref=e93]:
                - generic [ref=e94] [cursor=pointer]:
                  - heading "Categories" [level=3] [ref=e95]
                  - link "Create new Categories" [ref=e97]:
                    - /url: /admin/collections/categories/create
                    - generic:
                      - generic:
                        - img
                  - link "Show all Categories" [ref=e98]:
                    - /url: /admin/collections/categories
              - listitem [ref=e99]:
                - generic [ref=e100] [cursor=pointer]:
                  - heading "Posts" [level=3] [ref=e101]
                  - link "Create new Posts" [ref=e103]:
                    - /url: /admin/collections/posts/create
                    - generic:
                      - generic:
                        - img
                  - link "Show all Posts" [ref=e104]:
                    - /url: /admin/collections/posts
              - listitem [ref=e105]:
                - generic [ref=e106] [cursor=pointer]:
                  - heading "埋め込みHTMLファイル" [level=3] [ref=e107]
                  - link "Create new 埋め込みHTMLファイル" [ref=e109]:
                    - /url: /admin/collections/html-files/create
                    - generic:
                      - generic:
                        - img
                  - link "Show all 埋め込みHTMLファイル" [ref=e110]:
                    - /url: /admin/collections/html-files
          - status [ref=e111]
  - status [ref=e112]
  - region "Notifications alt+T"
  - alert [ref=e113]: Dashboard - Payload
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | /**
  4  |  * E2E test for the admin login flow.
  5  |  */
  6  | test('admin login flow redirects to dashboard', async ({ page }) => {
  7  |   // Navigate to the login page
  8  |   await page.goto('/admin/login');
  9  | 
  10 |   // Wait for the login form to be visible
  11 |   await expect(page.locator('form')).toBeVisible();
  12 | 
  13 |   // Enter credentials
  14 |   // Regex to handle " *" suffix in labels like "Email *"
  15 |   await page.getByLabel(/email/i).fill(process.env.TEST_ADMIN_EMAIL || 'indexlove0815@icloud.com');
  16 |   await page.getByLabel(/password/i).fill(process.env.TEST_ADMIN_PASSWORD || '');
  17 |   
  18 |   // Submit the form
  19 |   await page.getByRole('button', { name: /login/i }).click();
  20 | 
  21 |   // Assert redirection to the dashboard
  22 |   // Use waitForURL to ensure the redirect happens before assertions
  23 |   await page.waitForURL(/\/admin(?!\/login)/, { timeout: 10000 });
  24 |   await expect(page).toHaveURL(/\/admin(?!\/login)/);
  25 |   
  26 |   // Verify that the dashboard is loaded (look for navigation)
> 27 |   await expect(page.locator('nav')).toBeVisible();
     |                                     ^ Error: expect(locator).toBeVisible() failed
  28 | });
  29 | 
```