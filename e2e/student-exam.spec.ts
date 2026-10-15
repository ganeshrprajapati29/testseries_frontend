import { expect, test } from '@playwright/test';

const unique = Date.now();

test('student registers, takes the demo test, sees result and solutions @mobile', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  // Register
  await page.goto('/register');
  await page.getByRole('textbox', { name: 'Full name' }).fill('E2E Student');
  await page.getByRole('textbox', { name: 'Email address' }).fill(`e2e-${unique}@example.com`);
  await page.getByRole('textbox', { name: 'Password', exact: true }).fill('Passw0rd1');
  await page.getByRole('textbox', { name: 'Confirm password' }).fill('Passw0rd1');
  await page.getByText('I agree to receive exam updates').click();
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  // Open the demo series and start the test
  await page.goto('/test-series/s/demo-upsc-prelims-gs-practice');
  await expect(page.getByRole('heading', { name: 'Demo: UPSC Prelims GS Practice Series' })).toBeVisible();
  await page.getByRole('button', { name: 'Add to My Tests - Free' }).click();
  await expect(page.getByText('You are enrolled in this series')).toBeVisible();
  await page.getByRole('link', { name: 'Start' }).first().click();

  await expect(page).toHaveURL(/\/instructions$/);
  await page.getByText('I have read and understood the instructions.').click();
  await page.getByRole('button', { name: 'I am ready to begin' }).click();

  // Exam interface
  await expect(page).toHaveURL(/\/exam\//);
  await expect(page.getByRole('timer')).toBeVisible();
  await page.getByRole('radio', { name: /Article 32/ }).click();
  await expect(page.getByRole('radio', { name: /Article 32/ })).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('button', { name: /Save & Next/ }).click();
  await expect(page.getByRole('heading', { name: /Question 2/ })).toBeVisible();

  await page.getByRole('button', { name: /Submit/ }).first().click();
  await expect(page.getByRole('dialog', { name: 'Submit test?' })).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Submit test' }).click();

  // Result
  await expect(page).toHaveURL(/\/results\//);
  await expect(page.getByText('Your score')).toBeVisible();
  await expect(page.getByText(/Rank/)).toBeVisible();

  await page.getByRole('link', { name: 'View solutions' }).click();
  await expect(page.getByRole('heading', { name: 'Solutions' })).toBeVisible();
  await expect(page.getByText('Correct answer').first()).toBeVisible();
});

test('protected pages redirect anonymous visitors to login', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login\?from=%2Fdashboard/);
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin\/login/);
});

test('PYQ pages list exams, subjects and papers', async ({ page }) => {
  await page.goto('/pyqs');
  await expect(page.getByRole('heading', { name: 'NDA PYQs' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'CDS PYQs' })).toBeVisible();
  await page.getByRole('link', { name: /Maths/ }).first().click();
  await expect(page).toHaveURL(/\/pyqs\/nda\/maths/);
  await expect(page.getByRole('link', { name: 'Demo NDA Maths Practice Paper' })).toBeVisible();
});
