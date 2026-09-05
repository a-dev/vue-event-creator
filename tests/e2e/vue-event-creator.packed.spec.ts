import { expect, test } from '@playwright/test';

test('the packed ESM package completes the critical event journey', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('.vec-event')).toHaveCount(1);
  await expect(page.locator('.vec-event')).toContainText('Package smoke test');
  const supportsSquircle = await page.evaluate(() =>
    CSS.supports('corner-shape', 'squircle'),
  );
  const radius = await page
    .locator('.vec-event')
    .evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).borderRadius),
    );
  expect(radius).toBeCloseTo(supportsSquircle ? 28 : 16.3268, 3);

  const day = page.getByRole('button', { name: '2026-09-06' });
  await day.click();
  await day.click();
  await page.getByLabel('Package title').fill('Packed package event');
  await page.getByRole('button', { name: 'Save' }).click();

  const savedEvent = page
    .locator('.vec-event')
    .filter({ hasText: 'Packed package event' });
  await expect(savedEvent).toBeVisible();
  await savedEvent.getByRole('button', { name: 'Remove' }).click();
  await savedEvent.getByRole('button', { name: 'Yes' }).click();
  await expect(savedEvent).toHaveCount(0);
});
