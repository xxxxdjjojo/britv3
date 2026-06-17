import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import type { ProviderDocument } from "@/types/marketplace";

// sonner toast is a side-effect-only dependency; mock it so we can assert on
// success/error feedback without rendering a real toaster.
const toastMock = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast: toastMock }));

import { DocumentUpload } from "@/components/provider/DocumentUpload";

// -- helpers ----------------------------------------------------------------

function makeFile(
  name: string,
  type: string,
  sizeBytes: number,
): File {
  const file = new File(["x"], name, { type });
  // happy-dom honours the constructed size for small blobs, so override to
  // simulate large files deterministically.
  Object.defineProperty(file, "size", { value: sizeBytes });
  return file;
}

function getDropZone(): HTMLElement {
  // The drop zone is the clickable container holding the prompt text.
  const prompt = screen.getByText(/Drop files here or click to browse/i);
  // eslint-disable-next-line testing-library/no-node-access
  const zone = prompt.closest("div");
  if (!zone) throw new Error("drop zone not found");
  return zone;
}

function getFileInput(): HTMLInputElement {
  // eslint-disable-next-line testing-library/no-node-access
  const input = document.querySelector(
    'input[type="file"]',
  ) as HTMLInputElement | null;
  if (!input) throw new Error("file input not found");
  return input;
}

function selectFiles(files: File[]): void {
  const input = getFileInput();
  fireEvent.change(input, { target: { files } });
}

const baseDoc: ProviderDocument = {
  id: "doc-1",
  user_id: "user-1",
  document_type: "gas_safe_certificate",
  file_name: "gas-safe.pdf",
  file_url: "https://storage.example/gas-safe.pdf",
  file_size: 204800,
  mime_type: "application/pdf",
  verification_status: "approved",
  expiry_date: null,
  reviewer_notes: null,
  reviewed_by: null,
  reviewed_at: null,
  created_at: new Date("2026-01-01"),
  updated_at: new Date("2026-01-01"),
};

function makeDoc(overrides: Partial<ProviderDocument>): ProviderDocument {
  return { ...baseDoc, ...overrides };
}

beforeEach(() => {
  toastMock.success.mockReset();
  toastMock.error.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("DocumentUpload", () => {
  describe("render: empty state", () => {
    it("renders the drop zone prompt and constraints with no documents", () => {
      render(<DocumentUpload />);
      expect(
        screen.getByText(/Drop files here or click to browse/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/PDF, JPEG, PNG, WebP .* max 10MB per file/i),
      ).toBeInTheDocument();
    });

    it("does not render the pending or uploaded sections initially", () => {
      render(<DocumentUpload />);
      expect(screen.queryByText("Files to Upload")).not.toBeInTheDocument();
      expect(screen.queryByText("Uploaded Documents")).not.toBeInTheDocument();
    });
  });

  describe("render: existing documents", () => {
    it("renders all existing documents with labelled type and size", () => {
      const docs: ProviderDocument[] = [
        makeDoc({ id: "d1", document_type: "identity_proof", file_name: "id.pdf", file_size: 1024 }),
        makeDoc({ id: "d2", document_type: "public_liability_insurance", file_name: "pli.pdf", file_size: 1048576 }),
      ];
      render(<DocumentUpload existingDocuments={docs} />);

      expect(screen.getByText("Uploaded Documents")).toBeInTheDocument();
      expect(screen.getByText("id.pdf")).toBeInTheDocument();
      expect(screen.getByText("pli.pdf")).toBeInTheDocument();
      // Type label + formatted size are rendered together.
      expect(screen.getByText(/Identity Proof/)).toBeInTheDocument();
      expect(screen.getByText(/Public Liability Insurance/)).toBeInTheDocument();
      expect(screen.getByText(/1\.0 KB/)).toBeInTheDocument();
      expect(screen.getByText(/1\.0 MB/)).toBeInTheDocument();
    });

    it.each([
      ["pending", "Pending"],
      ["approved", "Approved"],
      ["rejected", "Rejected"],
      ["more_info_required", "More Info Required"],
    ] as const)(
      "renders the %s status badge label %s",
      (status, label) => {
        render(
          <DocumentUpload
            existingDocuments={[makeDoc({ id: `s-${status}`, verification_status: status })]}
          />,
        );
        expect(screen.getByText(label)).toBeInTheDocument();
      },
    );
  });

  describe("file validation", () => {
    it("rejects a file with a disallowed mime type and shows an error toast", () => {
      render(<DocumentUpload />);
      selectFiles([makeFile("malware.exe", "application/x-msdownload", 1024)]);

      expect(toastMock.error).toHaveBeenCalledWith(
        expect.stringContaining("Only PDF, JPEG, PNG, and WebP files are allowed"),
      );
      // Invalid file is not added to the pending list.
      expect(screen.queryByText("Files to Upload")).not.toBeInTheDocument();
    });

    it("rejects a file larger than 10MB", () => {
      render(<DocumentUpload />);
      selectFiles([makeFile("huge.pdf", "application/pdf", 11 * 1024 * 1024)]);

      expect(toastMock.error).toHaveBeenCalledWith(
        expect.stringContaining("File size must be under 10MB"),
      );
      expect(screen.queryByText("Files to Upload")).not.toBeInTheDocument();
    });

    it.each([
      ["application/pdf", "doc.pdf"],
      ["image/jpeg", "photo.jpg"],
      ["image/png", "photo.png"],
      ["image/webp", "photo.webp"],
    ])("accepts allowed type %s", (mime, name) => {
      render(<DocumentUpload />);
      selectFiles([makeFile(name, mime, 1024)]);

      expect(toastMock.error).not.toHaveBeenCalled();
      expect(screen.getByText("Files to Upload")).toBeInTheDocument();
      expect(screen.getByText(name)).toBeInTheDocument();
    });

    it("keeps valid files and drops invalid ones from a mixed selection", () => {
      render(<DocumentUpload />);
      selectFiles([
        makeFile("ok.pdf", "application/pdf", 1024),
        makeFile("bad.exe", "application/x-msdownload", 1024),
      ]);

      expect(screen.getByText("ok.pdf")).toBeInTheDocument();
      expect(screen.queryByText("bad.exe")).not.toBeInTheDocument();
      expect(toastMock.error).toHaveBeenCalledTimes(1);
    });
  });

  describe("pending file management", () => {
    it("adds a pending file with an Upload and remove control", () => {
      render(<DocumentUpload />);
      selectFiles([makeFile("cert.pdf", "application/pdf", 2048)]);

      expect(screen.getByText("cert.pdf")).toBeInTheDocument();
      expect(screen.getByText(/2\.0 KB/)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^Upload$/i })).toBeInTheDocument();
    });

    it("removes a pending file when its remove button is clicked", () => {
      render(<DocumentUpload />);
      selectFiles([makeFile("cert.pdf", "application/pdf", 2048)]);
      expect(screen.getByText("cert.pdf")).toBeInTheDocument();

      const row = screen.getByText("cert.pdf").closest("div")?.parentElement
        ?.parentElement as HTMLElement;
      // The remove control is the icon-only button next to Upload.
      const buttons = within(row).getAllByRole("button");
      // Last button is the X (remove); first is Upload.
      fireEvent.click(buttons[buttons.length - 1]);

      expect(screen.queryByText("cert.pdf")).not.toBeInTheDocument();
    });
  });

  describe("upload interaction (fetch mocked, no real network)", () => {
    it("posts FormData to the documents endpoint and removes the row on success", async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
      vi.stubGlobal("fetch", fetchMock);
      const onUploadSuccess = vi.fn();

      render(<DocumentUpload onUploadSuccess={onUploadSuccess} />);
      selectFiles([makeFile("cert.pdf", "application/pdf", 2048)]);
      fireEvent.click(screen.getByRole("button", { name: /^Upload$/i }));

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          "/api/providers/documents/upload",
          expect.objectContaining({ method: "POST" }),
        );
      });
      const body = fetchMock.mock.calls[0][1].body as FormData;
      expect(body.get("document_type")).toBe("identity_proof");
      expect(body.get("file")).toBeInstanceOf(File);

      await waitFor(() =>
        expect(screen.queryByText("cert.pdf")).not.toBeInTheDocument(),
      );
      expect(toastMock.success).toHaveBeenCalledWith(
        expect.stringContaining("cert.pdf"),
      );
      expect(onUploadSuccess).toHaveBeenCalledTimes(1);
    });

    it("shows an error toast and keeps the row when the upload fails", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: () => Promise.resolve({ error: "Unsupported document" }),
      });
      vi.stubGlobal("fetch", fetchMock);

      render(<DocumentUpload />);
      selectFiles([makeFile("cert.pdf", "application/pdf", 2048)]);
      fireEvent.click(screen.getByRole("button", { name: /^Upload$/i }));

      await waitFor(() =>
        expect(toastMock.error).toHaveBeenCalledWith("Unsupported document"),
      );
      // Row remains so the user can retry.
      expect(screen.getByText("cert.pdf")).toBeInTheDocument();
    });

    it("surfaces a network rejection as an error toast", async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error("Network down"));
      vi.stubGlobal("fetch", fetchMock);

      render(<DocumentUpload />);
      selectFiles([makeFile("cert.pdf", "application/pdf", 2048)]);
      fireEvent.click(screen.getByRole("button", { name: /^Upload$/i }));

      await waitFor(() =>
        expect(toastMock.error).toHaveBeenCalledWith("Network down"),
      );
      expect(screen.getByText("cert.pdf")).toBeInTheDocument();
    });
  });

  // FINDING: The per-file document-type <Select> is built on @base-ui/react
  // (portal + pointer-driven listbox). happy-dom does not surface the option
  // list on a programmatic click, so changing the document type before upload
  // cannot be asserted deterministically here. The default type
  // ("identity_proof") IS verified via the FormData assertion above. Selecting
  // a non-default type would need a real-browser (Playwright) test.
  it.skip("changes the document type via the per-file select before upload", () => {
    // Covered by E2E; see FINDING above.
  });

  // FINDING: There is no VerificationStepper, TrustScoreGauge, badges gallery,
  // client/peer reference request UI, service-area map editor, services
  // checklist, or portfolio gallery component under src/components/provider/.
  // Only DocumentUpload, AvailabilityCalendar, and ProviderProfileForm exist.
  // Credential upload is covered above; services config + service-area (radius)
  // live in ProviderProfileForm and are tested there.
});
