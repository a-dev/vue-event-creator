import { afterEach, describe, expect, test } from 'vitest';
import '../../src/styles/vars.css';
import '../../src/styles/event.css';

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
