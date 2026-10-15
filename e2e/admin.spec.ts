import { expect, test } from '@playwright/test';

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@civilsansad.com';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'Admin@12345';
const unique = Date.now();

test('admin signs in, creates a category, a series and a test, and adds a question', async ({ page }) => {
  await page.goto('/admin/login');
  await page.getByLabel('Admin email').fill(ADMIN_EMAIL);
  await page.getByLabel('Password', { exact: true }).fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

  // Category
  await page.goto('/admin/categories');
  await page.getByRole('button', { name: 'Add category' }).click();
  const categoryName = `E2E Exam ${unique}`;
  await page.getByRole('dialog').getByLabel('Name').fill(categoryName);
  await page.getByRole('dialog').getByRole('button', { name: 'Create category' }).click();
  await expect(page.getByText(categoryName)).toBeVisible();

  // Series
  await page.goto('/admin/test-series');
  await page.getByRole('button', { name: 'New test series' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Title').fill(`E2E Series ${unique}`);
  await dialog.getByLabel('Category').selectOption({ label: categoryName });
  await dialog.getByRole('button', { name: 'Create series' }).click();
  await expect(page).toHaveURL(/\/admin\/test-series\/[a-f0-9]{24}/);

  // Test
  await page.getByRole('button', { name: 'Add test' }).first().click();
  await page.getByRole('dialog').getByLabel('Test title').fill(`E2E Mock ${unique}`);
  await page.getByRole('dialog').getByRole('button', { name: 'Create test' }).click();
  await expect(page).toHaveURL(/\/admin\/tests\/[a-f0-9]{24}/);

  // Question
  await page.getByRole('button', { name: 'Write new question' }).click();
  const q = page.getByRole('dialog');
  await q.getByLabel('Question').fill('What is 2 + 2?');
  await q.getByLabel('Option A text').fill('3');
  await q.getByLabel('Option B text').fill('4');
  await q.getByLabel('Option C text').fill('5');
  await q.getByLabel('Option D text').fill('22');
  await q.getByLabel('Option B is correct').check();
  await q.getByRole('button', { name: 'Create question' }).click();
  await expect(page.getByText('What is 2 + 2?')).toBeVisible();

  await page.getByRole('button', { name: 'Publish' }).click();
  await expect(page.getByText('Test published')).toBeVisible();
});
