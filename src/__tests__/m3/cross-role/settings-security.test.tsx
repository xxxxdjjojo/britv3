import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PasswordChangeCard } from "@/components/settings/PasswordChangeCard";
import { ActiveSessionsList } from "@/components/settings/ActiveSessionsList";
import {
  LoginHistoryTable,
  type LoginHistoryEntry,
} from "@/components/settings/LoginHistoryTable";
import { TotpEnrollmentCard } from "@/components/settings/TotpEnrollmentCard";

// ---------------------------------------------------------------------------
// PasswordChangeCard — prop-driven form
// ---------------------------------------------------------------------------

function renderPasswordCard(overrides?: Partial<React.ComponentProps<typeof PasswordChangeCard>>) {
  const props: React.ComponentProps<typeof PasswordChangeCard> = {
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    changingPassword: false,
    hasPassword: true,
    onCurrentPasswordChange: vi.fn(),
    onNewPasswordChange: vi.fn(),
    onConfirmPasswordChange: vi.fn(),
    onSubmit: vi.fn(),
    onReauthRequired: vi.fn(),
    ...overrides,
  };
  return { props, ...render(<PasswordChangeCard {...props} />) };
}

describe("PasswordChangeCard", () => {
  it("renders Change Password title and current-password field when hasPassword", () => {
    renderPasswordCard({ hasPassword: true });
    expect(screen.getByText("Change Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Current Password")).toBeInTheDocument();
  });

  it("renders Set Password title and SSO notice when no existing password", () => {
    renderPasswordCard({ hasPassword: false });
    // "Set Password" appears as both the card title and the submit button.
    expect(screen.getAllByText("Set Password").length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByLabelText("Current Password")).not.toBeInTheDocument();
    expect(screen.getByText(/uses Google Sign-In/i)).toBeInTheDocument();
  });

  it("shows a mismatch message when confirm differs from new password", () => {
    renderPasswordCard({ newPassword: "longenoughpass1", confirmPassword: "different" });
    expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
  });

  it("does not show mismatch when passwords are equal", () => {
    renderPasswordCard({ newPassword: "longenoughpass1", confirmPassword: "longenoughpass1" });
    expect(screen.queryByText("Passwords do not match")).not.toBeInTheDocument();
  });

  it("triggers reauth (not direct submit) on submit when hasPassword", () => {
    const { props } = renderPasswordCard({ hasPassword: true });
    fireEvent.submit(screen.getByRole("button", { name: /update password/i }).closest("form")!);
    expect(props.onReauthRequired).toHaveBeenCalledTimes(1);
    expect(props.onSubmit).not.toHaveBeenCalled();
  });

  it("submits directly on submit for SSO-only users", () => {
    const { props } = renderPasswordCard({ hasPassword: false });
    fireEvent.submit(screen.getByRole("button", { name: /set password/i }).closest("form")!);
    expect(props.onSubmit).toHaveBeenCalledTimes(1);
    expect(props.onReauthRequired).not.toHaveBeenCalled();
  });

  it("disables the submit button while changing", () => {
    renderPasswordCard({ changingPassword: true });
    expect(screen.getByRole("button", { name: /update password/i })).toBeDisabled();
  });

  it("forwards new-password input changes", () => {
    const { props } = renderPasswordCard();
    fireEvent.change(screen.getByLabelText("New Password"), { target: { value: "abc" } });
    expect(props.onNewPasswordChange).toHaveBeenCalledWith("abc");
  });
});

// ---------------------------------------------------------------------------
// ActiveSessionsList
// ---------------------------------------------------------------------------

type SessionInfo = React.ComponentProps<typeof ActiveSessionsList>["sessions"][number];

function session(overrides?: Partial<SessionInfo>): SessionInfo {
  return {
    id: "sess-1",
    user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X)",
    created_at: "2026-01-10T08:00:00Z",
    last_sign_in_at: "2026-01-15T09:00:00Z",
    is_current: false,
    ...overrides,
  };
}

describe("ActiveSessionsList", () => {
  const baseHandlers = {
    signingOut: false,
    signingOutSession: null,
    onSignOutAll: vi.fn(),
    onSignOutSession: vi.fn(),
  };

  it("shows the loading state", () => {
    render(
      <ActiveSessionsList sessions={[]} sessionsLoading {...baseHandlers} />,
    );
    expect(screen.getByText(/Loading sessions/i)).toBeInTheDocument();
  });

  it("shows the current-device fallback when there are no listed sessions", () => {
    render(
      <ActiveSessionsList sessions={[]} sessionsLoading={false} {...baseHandlers} />,
    );
    expect(screen.getByText("Current Device")).toBeInTheDocument();
  });

  it("renders a session row with a friendly device name", () => {
    render(
      <ActiveSessionsList
        sessions={[session()]}
        sessionsLoading={false}
        {...baseHandlers}
      />,
    );
    expect(screen.getByText("Mac")).toBeInTheDocument();
  });

  it("marks the current session with a badge and hides its sign-out button", () => {
    render(
      <ActiveSessionsList
        sessions={[session({ is_current: true })]}
        sessionsLoading={false}
        {...baseHandlers}
      />,
    );
    expect(screen.getByText("Current session")).toBeInTheDocument();
    expect(screen.queryByText("Sign out this session")).not.toBeInTheDocument();
  });

  it("calls onSignOutSession for a non-current session", () => {
    const onSignOutSession = vi.fn();
    render(
      <ActiveSessionsList
        sessions={[session({ id: "sess-9", is_current: false })]}
        sessionsLoading={false}
        {...baseHandlers}
        onSignOutSession={onSignOutSession}
      />,
    );
    fireEvent.click(screen.getByText("Sign out this session").closest("button")!);
    expect(onSignOutSession).toHaveBeenCalledWith("sess-9");
  });

  it("calls onSignOutAll when the destructive button is clicked", () => {
    const onSignOutAll = vi.fn();
    render(
      <ActiveSessionsList
        sessions={[]}
        sessionsLoading={false}
        {...baseHandlers}
        onSignOutAll={onSignOutAll}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /sign out of all devices/i }));
    expect(onSignOutAll).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// LoginHistoryTable
// ---------------------------------------------------------------------------

function entry(overrides?: Partial<LoginHistoryEntry>): LoginHistoryEntry {
  return {
    id: "h1",
    created_at: "2026-01-15T09:00:00Z",
    ip_address: "192.0.2.10",
    action: "login",
    user_agent: "Mozilla/5.0 (Windows NT 10.0)",
    ...overrides,
  };
}

describe("LoginHistoryTable", () => {
  it("shows the loading state", () => {
    render(<LoginHistoryTable entries={[]} loading fallback={false} />);
    expect(screen.getByText(/Loading login history/i)).toBeInTheDocument();
  });

  it("shows the fallback notice when history is unavailable", () => {
    render(<LoginHistoryTable entries={[]} loading={false} fallback />);
    expect(screen.getByText(/not available for your account/i)).toBeInTheDocument();
  });

  it("shows the empty state when there are no entries", () => {
    render(<LoginHistoryTable entries={[]} loading={false} fallback={false} />);
    expect(screen.getByText("No login history found.")).toBeInTheDocument();
  });

  it("renders a row with friendly action and device labels", () => {
    render(
      <LoginHistoryTable entries={[entry()]} loading={false} fallback={false} />,
    );
    expect(screen.getByText("Login")).toBeInTheDocument();
    expect(screen.getByText("Windows")).toBeInTheDocument();
    expect(screen.getByText("192.0.2.10")).toBeInTheDocument();
  });

  it("renders a dash for a missing IP address", () => {
    render(
      <LoginHistoryTable
        entries={[entry({ ip_address: null })]}
        loading={false}
        fallback={false}
      />,
    );
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("maps logout action to its friendly label", () => {
    render(
      <LoginHistoryTable
        entries={[entry({ id: "h2", action: "logout" })]}
        loading={false}
        fallback={false}
      />,
    );
    expect(screen.getByText("Logout")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// TotpEnrollmentCard — MFA states
// ---------------------------------------------------------------------------

function renderTotp(overrides?: Partial<React.ComponentProps<typeof TotpEnrollmentCard>>) {
  const props: React.ComponentProps<typeof TotpEnrollmentCard> = {
    mfaState: "DISABLED",
    mfaLoading: false,
    totpData: null,
    totpCode: "",
    verifying: false,
    enrolling: false,
    disabling: false,
    backupCodes: null,
    regenerating: false,
    copiedAll: false,
    onTotpCodeChange: vi.fn(),
    onStartEnroll: vi.fn(),
    onVerify: vi.fn(),
    onDisable: vi.fn(),
    onRegenerateBackupCodes: vi.fn(),
    onCopyAll: vi.fn(),
    onDownload: vi.fn(),
    onDismissBackupCodes: vi.fn(),
    ...overrides,
  };
  return { props, ...render(<TotpEnrollmentCard {...props} />) };
}

describe("TotpEnrollmentCard MFA states", () => {
  it("shows a loading state and hides the status badge while loading", () => {
    renderTotp({ mfaLoading: true });
    expect(screen.getByText(/Loading 2FA status/i)).toBeInTheDocument();
    expect(screen.queryByText("Not set up")).not.toBeInTheDocument();
  });

  it("shows 'Not set up' badge and an enrol button when DISABLED", () => {
    renderTotp({ mfaState: "DISABLED" });
    expect(screen.getByText("Not set up")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /set up authenticator app/i }),
    ).toBeInTheDocument();
  });

  it("calls onStartEnroll when the enrol button is clicked", () => {
    const { props } = renderTotp({ mfaState: "DISABLED" });
    fireEvent.click(screen.getByRole("button", { name: /set up authenticator app/i }));
    expect(props.onStartEnroll).toHaveBeenCalledTimes(1);
  });

  it("shows 'Setup in progress' badge and the resume banner when PENDING without totpData", () => {
    renderTotp({ mfaState: "PENDING", totpData: null });
    expect(screen.getByText("Setup in progress")).toBeInTheDocument();
    expect(screen.getByText(/2FA setup is incomplete/i)).toBeInTheDocument();
  });

  it("shows the QR code when PENDING with totpData", () => {
    renderTotp({
      mfaState: "PENDING",
      totpData: {
        qr_code: "data:image/png;base64,abc",
        secret: "JBSWY3DPEHPK3PXP",
        uri: "otpauth://totp/x",
      },
    });
    expect(screen.getByAltText(/QR code for authenticator app/i)).toBeInTheDocument();
    expect(screen.getByText("JBSWY3DPEHPK3PXP")).toBeInTheDocument();
  });

  it("shows 'Active' badge when ENABLED", () => {
    renderTotp({ mfaState: "ENABLED" });
    expect(screen.getByText("Active")).toBeInTheDocument();
  });
});
