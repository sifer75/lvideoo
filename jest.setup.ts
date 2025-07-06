import '@testing-library/jest-dom';
import { act } from '@testing-library/react';

// Mock IntersectionObserver
let intersectionObserverCallbacks = new Map();

const mockIntersectionObserver = jest.fn((callback: IntersectionObserverCallback, options?: IntersectionObserverInit) => ({
  thresholds: Array.isArray(options?.threshold) ? options?.threshold : [options?.threshold || 0],
  root: options?.root || null,
  rootMargin: options?.rootMargin || '',
  takeRecords: jest.fn(() => []),
  observe: jest.fn(element => {
    intersectionObserverCallbacks.set(element, callback);
  }),
  unobserve: jest.fn(element => {
    intersectionObserverCallbacks.delete(element);
  }),
  disconnect: jest.fn(() => {
    intersectionObserverCallbacks.clear();
  }),
}));

window.IntersectionObserver = mockIntersectionObserver;

// Helper to trigger IntersectionObserver callbacks
(window as any).triggerIntersectionObserver = (element: Element, isIntersecting: boolean) => {
  const callback = intersectionObserverCallbacks.get(element);
  if (callback) {
    act(() => {
      callback([{ isIntersecting, target: element } as IntersectionObserverEntry], {} as IntersectionObserver);
    });
  }
};