import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import DocumentsPage from "./page";
import type { UserDocument } from "@/services/documents/documents-service";

// Mock next/link to a plain anchor (InsightPanel CTA uses it).
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Hooks are mutable so each test can control the documents payload.
const mockUseDocuments = vi.fn();
vi.mock("@/hooks/useDocuments", () => ({
  useDocuments: () => mockUseDocuments(),
  useUploadDocument: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteDocument: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("DocumentsPage", () => {
  it("renders the heading, subtitle, and privacy panel", () => {
    mockUseDocuments.mockReturnValue({ data: [], isLoading: false, error: null });
    render(<DocumentsPage />);

    expect(screen.getByRole("heading", { name: /document vault/i })).toBeInTheDocument();
    expect(screen.getAllByText(/institutional-grade security/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/privacy & encryption/i)).toBeInTheDocument();
    expect(screen.getByText(/^encrypted$/i)).toBeInTheDocument();
    expect(screen.getByText(/gdpr-compliant/i)).toBeInTheDocument();
  });

  it("renders the empty state when no documents exist", () => {
    mockUseDocuments.mockReturnValue({ data: [], isLoading: false, error: null });
    render(<DocumentsPage />);

    expect(screen.getByText(/no documents uploaded yet/i)).toBeInTheDocument();
  });

  it("renders the recent uploads table with a status pill when documents exist", () => {
    const doc: UserDocument = {
      id: "doc-1",
      user_id: "user-1",
      offer_id: null,
      document_type: "id_proof",
      storage_path: "path/passport.pdf",
      file_name: "passport.pdf",
      file_size_bytes: 2_400_000,
      mime_type: "application/pdf",
      status: "verified",
      created_at: "2026-06-01T10:00:00.000Z",
      updated_at: "2026-06-01T10:00:00.000Z",
    };
    mockUseDocuments.mockReturnValue({ data: [doc], isLoading: false, error: null });
    render(<DocumentsPage />);

    expect(screen.getByText("Recent Uploads")).toBeInTheDocument();
    expect(screen.getByText("passport.pdf")).toBeInTheDocument();
    expect(screen.getByText("ID Proof")).toBeInTheDocument();
    expect(screen.getByText("Verified")).toBeInTheDocument();
  });
});
