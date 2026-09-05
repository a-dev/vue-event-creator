import { afterEach, describe, expect, test } from 'vitest';
import '../../src/styles/vars.css';
import '../../src/styles/event.css';
import '../../src/styles/calendar.css';
import '../../src/styles/day.css';
import '../../src/styles/month.css';
import '../../src/styles/shapes.css';

const PALETTE_TERTIARY = 'rgb(210, 239, 244)'; // hsl(188, 61%, 89%)

let host: HTMLElement | null = null;

const renderHeader = (overrides = ''): HTMLElement => {
  host = document.createElement('div');
  host.className = 'vec-body';
  host.style.cssText = overrides;
  host.innerHTML = '<div class="vec-event__header"></div>';
  document.body.append(host);
  return host.querySelector<HTMLElement>('.vec-event__header')!;
};

afterEach(() => {
  host?.remove();
  host = null;
});

describe('Public palette variables', () => {
  test('The tertiary colour keeps its published value', () => {
    const header = renderHeader();

    expect(getComputedStyle(header).backgroundColor).toBe(PALETTE_TERTIARY);
  });

  test('The tertiary colour is overridable', () => {
    const header = renderHeader('--vec-color-tertiary: rgb(1, 2, 3)');

    expect(getComputedStyle(header).backgroundColor).toBe('rgb(1, 2, 3)');
  });

  test('The 2.0 misspelling is gone and has no effect', () => {
    const header = renderHeader('--vec-color-tertiaty: rgb(1, 2, 3)');

    expect(
      getComputedStyle(host!).getPropertyValue('--vec-color-tertiary'),
    ).not.toContain('tertiaty');
    expect(getComputedStyle(header).backgroundColor).toBe(PALETTE_TERTIARY);
  });
});

describe('Calendar width and day geometry', () => {
  const renderCalendar = (
    hostWidth: string,
    overrides = '',
  ): { calendar: HTMLElement; day: HTMLElement } => {
    host = document.createElement('div');
    host.className = 'vec-body';
    host.style.cssText = `width: ${hostWidth}; ${overrides}`;
    host.innerHTML =
      '<div class="vec-calendar"><div class="vec-month">' +
      '<div class="vec-month__days"><button class="vec-day"></button></div>' +
      '</div></div>';
    document.body.append(host);

    return {
      calendar: host.querySelector<HTMLElement>('.vec-calendar')!,
      day: host.querySelector<HTMLElement>('.vec-day')!,
    };
  };

  test('The calendar stops growing at the published maximum width', () => {
    const { calendar } = renderCalendar('900px');
    const published = getComputedStyle(host!).getPropertyValue(
      '--vec-calendar-max-width',
    );

    expect(published).not.toBe('');
    expect(calendar.getBoundingClientRect().width).toBe(
      Number.parseFloat(published),
    );
  });

  test('The maximum width is overridable', () => {
    const { calendar } = renderCalendar(
      '900px',
      '--vec-calendar-max-width: 360px;',
    );

    expect(calendar.getBoundingClientRect().width).toBe(360);
  });

  test('Day cells stay square so their circular shape never flattens', () => {
    const { day } = renderCalendar('900px');
    const box = day.getBoundingClientRect();

    expect(box.width).toBeGreaterThan(40);
    expect(box.height).toBeCloseTo(box.width, 1);
  });

  test('Day cells keep a 40px touch target in the narrowest layout', () => {
    const { day } = renderCalendar('320px');
    const box = day.getBoundingClientRect();

    expect(box.height).toBeGreaterThanOrEqual(40);
  });
});
