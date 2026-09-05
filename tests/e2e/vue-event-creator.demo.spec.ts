import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/?e2e=1');
  await expect(page.locator('.vec-loader__wrapper')).toHaveCount(0);
});

test('loads, navigates the calendar, focuses events, switches locale, and adapts responsively', async ({
  page,
}) => {
  await expect(page.locator('.vec-event')).toHaveCount(5);
  await expect(page.getByText('Today', { exact: true })).toBeVisible();

  const monthCount = await page.locator('.vec-month').count();
  await page.getByRole('button', { name: 'More after' }).click();
  await expect(page.locator('.vec-month')).toHaveCount(monthCount + 3);

  await page.getByRole('button', { name: '2026-09-01' }).click();
  await expect(
    page.locator('.vec-event').filter({ hasText: 'Today' }),
  ).toHaveClass(/vec-event_focused/);

  await page.getByRole('button', { name: 'Ru' }).click();
  await expect(
    page.getByRole('button', { name: 'Удалить' }).first(),
  ).toBeVisible();

  await page.setViewportSize({ width: 375, height: 700 });
  const switcher = page.getByRole('button', {
    name: 'Показать или скрыть календарь',
  });
  await expect(switcher).toBeVisible();
  await expect(switcher).toHaveAttribute('aria-expanded', 'false');
  await switcher.click();
  await expect(switcher).toHaveAttribute('aria-expanded', 'true');
});

test('creates, validates, retries, edits, cancels, and removes events', async ({
  page,
}) => {
  const day = page.getByRole('button', { name: '2026-09-08' });
  await day.click();
  await day.click();

  const title = page.getByLabel('Event title');
  const description = page.getByLabel('Event description');
  await title.fill('Reject once');
  await description.fill('Preserve this input');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByRole('alert')).toHaveText('Demo validation failed');
  await expect(title).toHaveValue('Reject once');
  await expect(description).toHaveValue('Preserve this input');

  await page.getByRole('button', { name: 'Save' }).click();
  const savedEvent = page
    .locator('.vec-event')
    .filter({ hasText: '08 September 2026' });
  await expect(savedEvent).not.toHaveClass(/vec-event_editing/);

  await savedEvent.getByRole('button', { name: 'Edit' }).click();
  await page.getByLabel('Event title').fill('Cancelled title');
  await savedEvent.getByRole('button', { name: 'Cancel' }).click();
  await expect(savedEvent).toContainText('Reject once');

  await savedEvent.getByRole('button', { name: 'Remove' }).click();
  await savedEvent.getByRole('button', { name: 'Yes' }).click();
  await expect(savedEvent).toHaveCount(0);

  await page.getByRole('button', { name: '2026-09-09' }).click();
  await page.getByRole('button', { name: '2026-09-10' }).click();
  const draft = page.locator('.vec-event_editing');
  await expect(draft).toContainText('09–10 September 2026');
  await draft.getByRole('button', { name: 'Remove' }).click();
  await expect(draft).toHaveCount(0);
});

test('supports keyboard-only event creation and editing', async ({ page }) => {
  const day = page.getByRole('button', { name: '2026-09-11' });
  await day.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');

  await expect(page.locator('.vec-event_editing')).toHaveCount(1);
  const title = page.getByLabel('Event title');
  await expect(title).toBeFocused();
  await title.fill('Keyboard event');
  await page.getByRole('button', { name: 'Save' }).focus();
  await page.keyboard.press('Enter');

  await expect(
    page.locator('.vec-event').filter({ hasText: 'Keyboard event' }),
  ).not.toHaveClass(/vec-event_editing/);
});

for (const width of [320, 375, 768]) {
  test(`keeps the planner usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 });
    const calendar = page.locator('.vec-calendar');
    const toggle = page.getByRole('button', { name: 'Toggle calendar' });
    if (width < 768) {
      await expect(calendar).toBeHidden();
      await toggle.focus();
      await page.keyboard.press('Tab');
      await expect(page.getByLabel('Default time from')).toBeFocused();
      await toggle.click();
      await expect(calendar).toBeVisible();
      await expect(toggle).toHaveAttribute(
        'aria-controls',
        (await calendar.getAttribute('id')) as string,
      );
    }

    const day = page.getByRole('button', { name: '2026-09-11' });
    const box = await day.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(32);
    expect(box?.height).toBeGreaterThanOrEqual(40);
    await day.click();
    await day.click();
    const title = page.getByLabel('Event title');
    await expect(title).toBeFocused();
    await title.fill('A mobile workshop');
    await page
      .getByLabel('Event description')
      .fill('A useful event with room for details.');
    await page.getByLabel('Event start time').fill('09:30');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    const card = page
      .locator('.vec-event')
      .filter({ hasText: '11 September 2026' });
    await expect(card).toContainText('09:30');
    await card.getByRole('button', { name: 'Edit', exact: true }).click();
    await card.getByRole('button', { name: 'Cancel', exact: true }).click();
    await card.getByRole('button', { name: 'Remove', exact: true }).click();
    await card.getByRole('button', { name: 'No', exact: true }).click();
    await expect(card).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);

    if (width < 768) {
      await toggle.focus();
      await page.keyboard.press('Enter');
      await expect(calendar).toBeHidden();
      await expect(toggle).toBeFocused();
    }
  });
}
