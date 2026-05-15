"use client";

/**
 * Save-with-a-Note button for the property detail page.
 *
 * - Logged in: heart icon toggles save state. On first save, shows an inline
 *   popover for an optional note (max 500 chars). On unsave, removes immediately.
 * - Not logged in: shows a "Sign in to save" prompt, stores save intent in
 *   sessionStorage, and links to the login page with a redirect param.
 * - Optimistic toggle with error rollback.
 * - 300 ms debounce guard against rapid double-clicks.
 */

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useId,
} from "react";
import { Heart, X, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEBOUNCE_MS = 300;
const MAX_NOTES_CHARS = 500;
const SESSION_KEY = "save_intent_property_id";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Props = Readonly<{
  propertyId: string;
  initialSaved?: boolean;
  initialNotes?: string | null;
}>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Call POST /api/properties/[id]/save with an optional note.
 * Throws on non-ok responses so the caller can roll back.
 */
async function apiSave(propertyId: string, notes?: string): Promise<void> {
  const res = await fetch(`/api/properties/${propertyId}/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notes: notes?.trim() || undefined }),
  });
  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(json.error ?? `Save failed (${res.status})`);
  }
}

/**
 * Call DELETE /api/properties/[id]/save.
 * Throws on non-ok responses so the caller can roll back.
 */
async function apiUnsave(propertyId: string): Promise<void> {
  const res = await fetch(`/api/properties/${propertyId}/save`, {
    method: "DELETE",
  });
  if (!res.ok && res.status !== 204) {
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(json.error ?? `Unsave failed (${res.status})`);
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SavePropertyButton({
  propertyId,
  initialSaved = false,
  initialNotes = null,
}: Props) {
  const { user, loading: authLoading } = useAuth();

  // Core state
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [showPanel, setShowPanel] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  // Debounce guard
  const lastClickRef = useRef<number>(0);

  // Stable note id for a11y label association
  const notesId = useId();

  // -------------------------------------------------------------------------
  // On mount: attempt auto-save if user just returned from login
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (authLoading || !user) return;

    const intent = sessionStorage.getItem(SESSION_KEY);
    if (intent === propertyId) {
      sessionStorage.removeItem(SESSION_KEY);
      if (!isSaved) {
        // Auto-save without a note — user can edit later
        setIsBusy(true);
        apiSave(propertyId)
          .then(() => setIsSaved(true))
          .catch(() => {
            // Silent — user can try manually
          })
          .finally(() => setIsBusy(false));
      }
    }
    // Run only once after auth resolves
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  // -------------------------------------------------------------------------
  // Main click handler
  // -------------------------------------------------------------------------
  const handleButtonClick = useCallback(() => {
    const now = Date.now();
    if (now - lastClickRef.current < DEBOUNCE_MS) return;
    lastClickRef.current = now;

    // Not logged in
    if (!user) {
      setShowAuthPrompt((prev) => !prev);
      return;
    }

    // Already saved → unsave immediately
    if (isSaved) {
      setIsSaved(false);
      setError(null);
      setIsBusy(true);
      apiUnsave(propertyId)
        .catch((err: unknown) => {
          setIsSaved(true); // rollback
          setError(err instanceof Error ? err.message : "Something went wrong");
        })
        .finally(() => setIsBusy(false));
      return;
    }

    // Not yet saved → open notes panel
    setShowPanel(true);
    setError(null);
  }, [user, isSaved, propertyId]);

  // -------------------------------------------------------------------------
  // Save with note
  // -------------------------------------------------------------------------
  const handleConfirmSave = useCallback(
    async (withNote: boolean) => {
      const noteValue = withNote ? notes.trim() : "";
      setShowPanel(false);
      setIsSaved(true); // optimistic
      setError(null);
      setIsBusy(true);

      try {
        await apiSave(propertyId, noteValue || undefined);
      } catch (err: unknown) {
        setIsSaved(false); // rollback
        setError(err instanceof Error ? err.message : "Could not save property");
      } finally {
        setIsBusy(false);
      }
    },
    [propertyId, notes],
  );

  // -------------------------------------------------------------------------
  // Auth-intent redirect
  // -------------------------------------------------------------------------
  const handleSignInRedirect = useCallback(() => {
    sessionStorage.setItem(SESSION_KEY, propertyId);
    const redirect = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/login?redirect=${redirect}`;
  }, [propertyId]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="relative inline-block">
      {/* Main heart button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleButtonClick}
        disabled={isBusy || authLoading}
        aria-label={isSaved ? "Remove from saved" : "Save property"}
        aria-pressed={isSaved}
        className={cn(
          "gap-1.5 transition-colors",
          isSaved && "border-[#1B4D3E] bg-[#E8F5EE] text-[#1B4D3E] hover:bg-[#E8F5EE]/80",
        )}
      >
        <Heart
          className={cn(
            "size-4 transition-all",
            isSaved ? "fill-[#1B4D3E] text-[#1B4D3E]" : "text-muted-foreground",
          )}
        />
        <span className="hidden sm:inline">{isSaved ? "Saved" : "Save"}</span>
      </Button>

      {/* Error message */}
      {error && (
        <p
          role="alert"
          className="absolute left-0 top-full mt-1 w-56 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 shadow-md z-30"
        >
          {error}
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-1 underline"
            aria-label="Dismiss error"
          >
            Dismiss
          </button>
        </p>
      )}

      {/* Notes panel (shown when saving for the first time) */}
      {showPanel && (
        <div
          role="dialog"
          aria-label="Save property with note"
          className={cn(
            "absolute right-0 top-full mt-2 w-72 rounded-xl border border-border bg-background shadow-lg z-30",
            "p-4 flex flex-col gap-3",
          )}
        >
          {/* Panel header */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">
              Add a note <span className="font-normal text-muted-foreground">(optional)</span>
            </p>
            <button
              type="button"
              onClick={() => setShowPanel(false)}
              className="rounded p-0.5 text-muted-foreground hover:text-foreground"
              aria-label="Close panel"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Notes textarea */}
          <div className="flex flex-col gap-1">
            <Textarea
              id={notesId}
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, MAX_NOTES_CHARS))}
              placeholder="Add a note about this property..."
              rows={3}
              className="resize-none text-sm"
              aria-label="Property note"
              maxLength={MAX_NOTES_CHARS}
            />
            <p className="self-end text-xs text-muted-foreground">
              {notes.length}/{MAX_NOTES_CHARS}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1.5">
            <Button
              size="sm"
              className="w-full bg-[#1B4D3E] text-white hover:bg-[#1B4D3E]/90"
              onClick={() => handleConfirmSave(true)}
              disabled={isBusy}
            >
              Save
            </Button>
            <button
              type="button"
              onClick={() => handleConfirmSave(false)}
              disabled={isBusy}
              className="text-xs text-muted-foreground underline-offset-2 hover:underline disabled:opacity-50"
            >
              Save without note
            </button>
          </div>
        </div>
      )}

      {/* Auth prompt (shown when not logged in) */}
      {showAuthPrompt && (
        <div
          role="dialog"
          aria-label="Sign in to save properties"
          className={cn(
            "absolute right-0 top-full mt-2 w-64 rounded-xl border border-border bg-background shadow-lg z-30",
            "p-4 flex flex-col gap-3",
          )}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">
              Save this property
            </p>
            <button
              type="button"
              onClick={() => setShowAuthPrompt(false)}
              className="rounded p-0.5 text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>

          <p className="text-xs text-muted-foreground">
            Sign in to save properties to your shortlist and add notes.
          </p>

          <Button
            size="sm"
            className="w-full gap-1.5 bg-[#1B4D3E] text-white hover:bg-[#1B4D3E]/90"
            onClick={handleSignInRedirect}
          >
            <LogIn className="size-4" />
            Sign in to save
          </Button>
        </div>
      )}
    </div>
  );
}
