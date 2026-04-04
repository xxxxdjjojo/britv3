"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = Readonly<{
  sectionName: string;
  children: ReactNode;
}>;

type State = {
  hasError: boolean;
  error: Error | null;
};

/**
 * Reusable error boundary for landlord dashboard sections.
 * Shows a retry-able error UI instead of crashing the entire page.
 * Used to replace silent catch-to-empty-array patterns.
 */
export class LandlordErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error(`[LandlordErrorBoundary] ${this.props.sectionName}:`, error);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-error/30 bg-error-light p-6 text-center dark:border-error/20 dark:bg-error/10">
          <AlertTriangle className="size-8 text-error" />
          <p className="text-sm font-medium text-error dark:text-error">
            Failed to load {this.props.sectionName}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={this.handleRetry}
            className="gap-2"
          >
            <RefreshCw className="size-3" />
            Retry
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
