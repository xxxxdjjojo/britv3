"use client";

import React from "react";

type Props = Readonly<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}>;

type State = {
  hasError: boolean;
};

export class PDFErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <span className="inline-flex items-center rounded-md border border-error/30 bg-error-light px-4 py-2 text-sm text-error">
            Unable to generate PDF. Please refresh the page.
          </span>
        )
      );
    }
    return this.props.children;
  }
}
