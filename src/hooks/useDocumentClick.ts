import { getCurrentScope, onScopeDispose } from 'vue';

export type VecDocumentClickHandler = (target: Element) => void;

export interface VecDocumentClickController {
  /**
   * Runs `handler` on the first document click that happens after the click
   * currently being dispatched. Registering the same `key` twice replaces the
   * previous registration, so a key never owns more than one live listener.
   */
  listenToNextClick: (key: string, handler: VecDocumentClickHandler) => void;
  /** Cancels a pending or active registration for `key`. */
  stop: (key: string) => void;
  /** Cancels every registration owned by this controller. */
  stopAll: () => void;
}

/**
 * Owns the document click listeners of one component instance and removes them
 * when the owning effect scope is disposed, so remounts cannot leak listeners.
 */
export function useDocumentClick(): VecDocumentClickController {
  const pendingTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
  const activeListeners = new Map<string, (event: MouseEvent) => void>();

  const stop = (key: string) => {
    const timeout = pendingTimeouts.get(key);
    if (timeout !== undefined) {
      clearTimeout(timeout);
      pendingTimeouts.delete(key);
    }

    const listener = activeListeners.get(key);
    if (listener) {
      document.removeEventListener('click', listener);
      activeListeners.delete(key);
    }
  };

  const listenToNextClick = (key: string, handler: VecDocumentClickHandler) => {
    stop(key);

    const timeout = setTimeout(() => {
      pendingTimeouts.delete(key);

      const listener = (event: MouseEvent) => {
        const target = event.target;
        if (!(target instanceof Element)) return;
        handler(target);
      };

      activeListeners.set(key, listener);
      document.addEventListener('click', listener);
    });

    pendingTimeouts.set(key, timeout);
  };

  const stopAll = () => {
    for (const key of [...pendingTimeouts.keys(), ...activeListeners.keys()]) {
      stop(key);
    }
  };

  if (getCurrentScope()) onScopeDispose(stopAll);

  return { listenToNextClick, stop, stopAll };
}
