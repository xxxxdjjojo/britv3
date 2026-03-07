import { vi } from "vitest";

// Mock next/navigation
export const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
};

export const mockPathname = "/";
export const mockSearchParams = new URLSearchParams();

export const useRouter = vi.fn(() => mockRouter);
export const usePathname = vi.fn(() => mockPathname);
export const useSearchParams = vi.fn(() => mockSearchParams);
export const redirect = vi.fn();
export const notFound = vi.fn();

// Mock next/headers
const mockCookieStore = {
  get: vi.fn().mockReturnValue(undefined),
  getAll: vi.fn().mockReturnValue([]),
  set: vi.fn(),
  delete: vi.fn(),
  has: vi.fn().mockReturnValue(false),
};

const mockHeadersStore = {
  get: vi.fn().mockReturnValue(null),
  getAll: vi.fn().mockReturnValue([]),
  has: vi.fn().mockReturnValue(false),
  forEach: vi.fn(),
  entries: vi.fn().mockReturnValue([]),
  keys: vi.fn().mockReturnValue([]),
  values: vi.fn().mockReturnValue([]),
};

export const cookies = vi.fn().mockResolvedValue(mockCookieStore);
export const headers = vi.fn().mockResolvedValue(mockHeadersStore);

// Helper to reset all mocks
export function resetNextMocks() {
  mockRouter.push.mockReset();
  mockRouter.replace.mockReset();
  mockRouter.refresh.mockReset();
  mockRouter.back.mockReset();
  mockRouter.forward.mockReset();
  mockRouter.prefetch.mockReset();
  useRouter.mockReturnValue(mockRouter);
  usePathname.mockReturnValue(mockPathname);
  useSearchParams.mockReturnValue(mockSearchParams);
  redirect.mockReset();
  notFound.mockReset();
  mockCookieStore.get.mockReturnValue(undefined);
  mockCookieStore.getAll.mockReturnValue([]);
  mockCookieStore.set.mockReset();
  mockCookieStore.delete.mockReset();
  mockCookieStore.has.mockReturnValue(false);
  mockHeadersStore.get.mockReturnValue(null);
}
