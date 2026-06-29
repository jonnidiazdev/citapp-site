import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRef } from 'react';
import { getFocusableElements, useDialogA11y } from './useDialogA11y';

describe('getFocusableElements', () => {
  it('returns enabled focusable elements inside container', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <button type="button" id="b1">One</button>
      <button type="button" id="b2" disabled>Two</button>
      <input id="i1" />
    `;
    document.body.appendChild(container);

    const focusable = getFocusableElements(container);
    expect(focusable.map((el) => el.id)).toEqual(['b1', 'i1']);

    document.body.removeChild(container);
  });
});

describe('useDialogA11y', () => {
  let container: HTMLDivElement;
  let trigger: HTMLButtonElement;

  beforeEach(() => {
    trigger = document.createElement('button');
    trigger.textContent = 'Open';
    document.body.appendChild(trigger);
    trigger.focus();

    container = document.createElement('div');
    container.tabIndex = -1;
    container.innerHTML = `
      <button type="button" id="first">First</button>
      <button type="button" id="last">Last</button>
    `;
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    document.body.style.overflow = '';
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    const containerRef = { current: container };

    renderHook(() =>
      useDialogA11y({
        isOpen: true,
        containerRef,
        onClose,
      })
    );

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('locks body scroll while open and restores on unmount', () => {
    const containerRef = { current: container };
    document.body.style.overflow = 'auto';

    const { unmount } = renderHook(() =>
      useDialogA11y({
        isOpen: true,
        containerRef,
        onClose: vi.fn(),
      })
    );

    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('auto');
  });

  it('restores focus to the previously focused element on close', () => {
    const containerRef = { current: container };

    const { unmount } = renderHook(() =>
      useDialogA11y({
        isOpen: true,
        containerRef,
        onClose: vi.fn(),
      })
    );

    const first = container.querySelector('#first') as HTMLButtonElement;
    first.focus();
    unmount();

    expect(document.activeElement).toBe(trigger);
  });

  it('focuses initialFocusRef when provided', () => {
    const containerRef = { current: container };
    const cancelButton = document.createElement('button');
    cancelButton.id = 'cancel';
    container.appendChild(cancelButton);

    renderHook(() => {
      const ref = useRef(cancelButton);
      useDialogA11y({
        isOpen: true,
        containerRef,
        onClose: vi.fn(),
        initialFocusRef: ref,
      });
      return ref;
    });

    expect(document.activeElement).toBe(cancelButton);
  });
});
