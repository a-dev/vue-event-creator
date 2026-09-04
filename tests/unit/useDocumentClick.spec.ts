import { effectScope } from 'vue';
import { describe, expect, test, vi } from 'vitest';
import {
  useDocumentClick,
  type VecDocumentClickHandler,
} from '../../src/hooks/useDocumentClick';

const clickOn = (element: Element) => {
  element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
};

const withTarget = async (fn: (target: HTMLElement) => Promise<void>) => {
  const target = document.createElement('button');
  document.body.append(target);
  try {
    await fn(target);
  } finally {
    target.remove();
  }
};

describe('useDocumentClick', () => {
  test('Runs the handler on the click after the one that registered it', async () => {
    await withTarget(async (target) => {
      const controller = useDocumentClick();
      const handler = vi.fn<VecDocumentClickHandler>();

      controller.listenToNextClick('key', handler);
      clickOn(target);
      expect(handler).not.toHaveBeenCalled();

      await vi.waitFor(() => {
        clickOn(target);
        expect(handler).toHaveBeenCalledWith(target);
      });

      controller.stopAll();
    });
  });

  test('Keeps only one live listener per key', async () => {
    await withTarget(async (target) => {
      const controller = useDocumentClick();
      const addListener = vi.spyOn(document, 'addEventListener');
      const first = vi.fn<VecDocumentClickHandler>();
      const second = vi.fn<VecDocumentClickHandler>();

      controller.listenToNextClick('key', first);
      controller.listenToNextClick('key', second);

      await vi.waitFor(() => {
        clickOn(target);
        expect(second).toHaveBeenCalledTimes(1);
      });
      expect(first).not.toHaveBeenCalled();
      expect(
        addListener.mock.calls.filter(([type]) => type === 'click'),
      ).toHaveLength(1);

      addListener.mockRestore();
      controller.stopAll();
    });
  });

  test('Stopping a pending registration prevents the listener entirely', async () => {
    await withTarget(async (target) => {
      const controller = useDocumentClick();
      const handler = vi.fn<VecDocumentClickHandler>();

      controller.listenToNextClick('key', handler);
      controller.stop('key');

      await new Promise((resolve) => setTimeout(resolve, 10));
      clickOn(target);
      clickOn(target);
      expect(handler).not.toHaveBeenCalled();
    });
  });

  test('Disposing the owning scope removes active listeners', async () => {
    await withTarget(async (target) => {
      const scope = effectScope();
      const handler = vi.fn<VecDocumentClickHandler>();
      const controller = scope.run(() => {
        const created = useDocumentClick();
        created.listenToNextClick('key', handler);
        return created;
      })!;

      await new Promise((resolve) => setTimeout(resolve, 10));
      scope.stop();

      clickOn(target);
      expect(handler).not.toHaveBeenCalled();

      controller.stopAll();
    });
  });

  test('Ignores clicks whose target is not an Element', async () => {
    const controller = useDocumentClick();
    const handler = vi.fn<VecDocumentClickHandler>();
    controller.listenToNextClick('key', handler);

    await new Promise((resolve) => setTimeout(resolve, 10));
    document.dispatchEvent(new MouseEvent('click'));
    expect(handler).not.toHaveBeenCalled();

    controller.stopAll();
  });
});
