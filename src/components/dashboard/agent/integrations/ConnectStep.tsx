"use client";

import type { AgentFeedIntegrationView, FeedProvider } from "@/types/agent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import {
  ShieldCheck,
  FileUp,
  FlaskConical,
  LayoutGrid,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Trash2,
  AlertCircle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Supported source configuration
// ---------------------------------------------------------------------------

type SupportedSource = {
  provider: FeedProvider;
  label: string;
  tagline: string;
  badge: string;
  icon: React.ElementType;
  iconClass: string;
  needsApiKey: boolean;
  needsCsv: boolean;
};

const SUPPORTED_SOURCES: SupportedSource[] = [
  {
    provider: "reapit",
    label: "Reapit Agency Cloud",
    tagline: "Sandbox demo — fixture listings imported via Reapit connector",
    badge: "Sandbox demo",
    icon: LayoutGrid,
    iconClass: "text-brand-primary-light",
    needsApiKey: true,
    needsCsv: false,
  },
  {
    provider: "sandbox",
    label: "Sandbox portfolio feed",
    tagline: "Generated demo listings for testing the full onboarding flow",
    badge: "Demo",
    icon: FlaskConical,
    iconClass: "text-brand-secondary",
    needsApiKey: false,
    needsCsv: false,
  },
  {
    provider: "csv",
    label: "CSV upload",
    tagline: "Import a CSV export from any estate agency CRM",
    badge: "Standard",
    icon: FileUp,
    iconClass: "text-muted-foreground",
    needsApiKey: false,
    needsCsv: true,
  },
];

// ---------------------------------------------------------------------------
// Default CSV field mapping
// ---------------------------------------------------------------------------

const DEFAULT_FIELD_MAPPING: Record<string, string> = {
  address: "property.address",
  bedrooms: "property.bedrooms",
  bathrooms: "property.bathrooms",
  price: "property.price",
  description: "property.description",
  images: "property.photos",
  status: "property.status",
  tenure: "property.tenure",
  epc_rating: "property.epc_rating",
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type ConnectStepProps = Readonly<{
  integrations: AgentFeedIntegrationView[];
  formProvider: FeedProvider;
  formApiKey: string;
  formFieldMapping: Record<string, string>;
  csvText: string | null;
  formError: string | null;
  formSubmitting: boolean;
  testingConnection: boolean;
  testResult: { ok: boolean; message: string } | null;
  syncingId: string | null;
  deletingId: string | null;
  onSelectProvider: (p: FeedProvider) => void;
  onApiKeyChange: (v: string) => void;
  onFieldMappingChange: (mapping: Record<string, string>) => void;
  onCsvFileChange: (text: string) => void;
  onTestConnection: (integrationId: string) => void;
  onSave: () => void;
  onSyncNow: (id: string) => void;
  onDelete: (id: string) => void;
  onConfirmDelete: (id: string) => void;
}>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ConnectStep({
  integrations,
  formProvider,
  formApiKey,
  formFieldMapping,
  csvText,
  formError,
  formSubmitting,
  testingConnection,
  testResult,
  syncingId,
  onSelectProvider,
  onApiKeyChange,
  onFieldMappingChange,
  onCsvFileChange,
  onTestConnection,
  onSave,
  onSyncNow,
  onDelete,
  onConfirmDelete,
}: ConnectStepProps) {
  const source = SUPPORTED_SOURCES.find((s) => s.provider === formProvider) ?? SUPPORTED_SOURCES[0];

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === "string") onCsvFileChange(text);
    };
    reader.readAsText(file);
  }

  return (
    <div className="space-y-8">
      {/* Data-access explainer */}
      <Card className="border-border bg-brand-primary-lighter/40 dark:bg-brand-primary/10">
        <CardContent className="flex gap-4 pt-4 pb-4">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-brand-primary dark:text-brand-primary-light" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-foreground">
              What TrueDeed reads — and what we never do
            </p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">We read:</span>{" "}
                only the property listings your agency explicitly authorises through this connection.
              </li>
              <li>
                <span className="font-medium text-foreground">We do not</span>{" "}
                scrape portals, ask for portal passwords, or fabricate listings.
              </li>
              <li>
                <span className="font-medium text-foreground">Reapit in this phase</span>{" "}
                is a sandbox demo integration — it imports fixture listings, not live CRM data.
                A full production Reapit OAuth integration is planned for a future release.
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Source selector */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Choose your data source
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {SUPPORTED_SOURCES.map((s) => {
            const Icon = s.icon;
            const selected = formProvider === s.provider;
            return (
              <button
                key={s.provider}
                type="button"
                aria-pressed={selected}
                onClick={() => onSelectProvider(s.provider)}
                className={[
                  "group flex flex-col gap-3 rounded-xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected
                    ? "border-brand-primary bg-brand-primary-lighter/60 dark:bg-brand-primary/15"
                    : "border-border bg-card hover:border-brand-primary/40 hover:bg-surface",
                ].join(" ")}
              >
                <div className="flex items-start justify-between">
                  <div className={`rounded-lg bg-surface p-2 ring-1 ring-border ${selected ? "ring-brand-primary/30" : ""}`}>
                    <Icon className={`size-4 ${s.iconClass}`} aria-hidden />
                  </div>
                  <Badge variant={selected ? "default" : "outline"} className="text-[10px]">
                    {s.badge}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{s.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{s.tagline}</p>
                </div>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Alto and Jupix are not yet supported — they will appear here when their connectors are built.
        </p>
      </div>

      {/* Source-specific configuration */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-4 text-sm font-semibold text-foreground">
          Configure {source?.label}
        </h3>

        {formError && (
          <Alert className="mb-4 border-destructive/30 bg-destructive/10 text-destructive">
            <AlertCircle className="size-4" aria-hidden />
            <span className="ml-2 text-sm">{formError}</span>
          </Alert>
        )}

        {/* API key — only for reapit */}
        {source?.needsApiKey && (
          <div className="mb-4">
            <label
              htmlFor="feed-api-key"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              API Key
            </label>
            <p className="mb-2 text-xs text-muted-foreground">
              Enter the API key from your Reapit sandbox account. This is stored encrypted and never displayed again.
            </p>
            <div className="flex gap-2">
              <input
                id="feed-api-key"
                type="password"
                value={formApiKey}
                onChange={(e) => onApiKeyChange(e.target.value)}
                placeholder="e.g. RPS-SANDBOX-XXXXXXXX"
                autoComplete="new-password"
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            {testResult && (
              <p
                className={`mt-2 flex items-center gap-1.5 text-xs ${
                  testResult.ok
                    ? "text-green-700 dark:text-green-400"
                    : "text-destructive"
                }`}
              >
                {testResult.ok ? (
                  <CheckCircle2 className="size-3.5" aria-hidden />
                ) : (
                  <XCircle className="size-3.5" aria-hidden />
                )}
                {testResult.message}
              </p>
            )}
          </div>
        )}

        {/* Sandbox needs no config */}
        {formProvider === "sandbox" && (
          <p className="mb-4 text-sm text-muted-foreground">
            The sandbox feed generates demo listings automatically. No configuration required.
          </p>
        )}

        {/* CSV upload + field mapping */}
        {source?.needsCsv && (
          <div className="mb-4 space-y-4">
            <div>
              <label
                htmlFor="csv-file-input"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Upload CSV file
              </label>
              <input
                id="csv-file-input"
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground file:mr-3 file:rounded file:border-0 file:bg-brand-primary-lighter/60 file:px-2 file:py-1 file:text-xs file:font-medium file:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {csvText && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-green-700 dark:text-green-400">
                  <CheckCircle2 className="size-3.5" aria-hidden />
                  File loaded — {csvText.split("\n").length - 1} data rows detected
                </p>
              )}
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-foreground">Field mapping</p>
              <p className="mb-3 text-xs text-muted-foreground">
                Map your CSV column headers to TrueDeed fields. Defaults are pre-filled.
              </p>
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Your CSV column</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">TrueDeed field</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {Object.entries(formFieldMapping).map(([source, dest]) => (
                      <tr key={source} className="bg-card">
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={source}
                            readOnly
                            aria-label={`Source column: ${source}`}
                            className="w-full bg-transparent text-muted-foreground focus:outline-none"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={dest}
                            aria-label={`Target field for ${source}`}
                            onChange={(e) =>
                              onFieldMappingChange({ ...formFieldMapping, [source]: e.target.value })
                            }
                            className="w-full rounded bg-transparent text-foreground focus:outline-none focus:ring-1 focus:ring-ring px-1"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="default"
            onClick={onSave}
            disabled={formSubmitting}
          >
            {formSubmitting ? "Adding…" : "Add connection"}
          </Button>
        </div>
      </div>

      {/* Existing integrations list */}
      {integrations.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Connected sources
          </h3>
          <div className="space-y-3">
            {integrations.map((integration) => (
              <IntegrationRow
                key={integration.id}
                integration={integration}
                syncing={syncingId === integration.id}
                onSyncNow={() => onSyncNow(integration.id)}
                onTestConnection={() => onTestConnection(integration.id)}
                onDelete={() => onConfirmDelete(integration.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {integrations.length === 0 && (
        <div className="rounded-xl border border-dashed border-border py-10 text-center">
          <p className="text-sm text-muted-foreground">
            No connections yet. Choose a source above and click{" "}
            <span className="font-medium text-foreground">Add connection</span>.
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Integration row sub-component
// ---------------------------------------------------------------------------

const PROVIDER_LABEL: Record<string, string> = {
  reapit: "Reapit (sandbox demo)",
  sandbox: "Sandbox portfolio",
  csv: "CSV upload",
  generic_feed: "Standard feed",
};

const STATUS_CONFIG: Record<
  string,
  { label: string; dotClass: string; badgeClass: string }
> = {
  disconnected: {
    label: "Disconnected",
    dotClass: "bg-muted-foreground",
    badgeClass: "text-muted-foreground",
  },
  connected: {
    label: "Connected",
    dotClass: "bg-green-500",
    badgeClass: "text-green-700 dark:text-green-400",
  },
  syncing: {
    label: "Syncing…",
    dotClass: "bg-green-400 animate-pulse",
    badgeClass: "text-green-700 dark:text-green-400",
  },
  error: {
    label: "Error",
    dotClass: "bg-destructive",
    badgeClass: "text-destructive",
  },
};

function IntegrationRow({
  integration,
  syncing,
  onSyncNow,
  onTestConnection,
  onDelete,
}: {
  integration: AgentFeedIntegrationView;
  syncing: boolean;
  onSyncNow: () => void;
  onTestConnection: () => void;
  onDelete: () => void;
}) {
  const status = STATUS_CONFIG[integration.sync_status] ?? STATUS_CONFIG.disconnected;
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-surface ring-1 ring-border">
          <LayoutGrid className="size-4 text-muted-foreground" aria-hidden />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {PROVIDER_LABEL[integration.provider] ?? integration.provider}
          </p>
          <p className={`flex items-center gap-1.5 text-xs ${status.badgeClass}`}>
            <span className={`inline-block size-1.5 rounded-full ${status.dotClass}`} aria-hidden />
            {status.label}
            {integration.last_sync_at && (
              <span className="text-muted-foreground">
                · last sync {new Date(integration.last_sync_at).toLocaleString("en-GB")}
              </span>
            )}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onTestConnection}
          aria-label="Test connection"
        >
          Test connection
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={syncing || integration.sync_status === "syncing"}
          onClick={onSyncNow}
          aria-label="Sync now"
        >
          <RefreshCw className={`size-3.5 ${syncing ? "animate-spin" : ""}`} aria-hidden />
          {syncing ? "Syncing…" : "Sync now"}
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={onDelete}
          aria-label="Delete integration"
        >
          <Trash2 className="size-3.5" aria-hidden />
        </Button>
      </div>
    </div>
  );
}

export { DEFAULT_FIELD_MAPPING };
