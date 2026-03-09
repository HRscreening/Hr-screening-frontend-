import React from "react";
import { Button } from "@/components/ui/button";

type Props = {
  children: React.ReactNode;
  fallbackTitle?: string;
};

type State = {
  hasError: boolean;
};

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // Keep this minimal; Vite/console already surfaces stack traces in dev.
    // In prod you can wire this to Sentry/etc.
    console.error("UI crashed:", error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-lg border bg-card p-6 text-center">
          <div className="mb-2 text-lg font-semibold">
            {this.props.fallbackTitle ?? "Something went wrong"}
          </div>
          <div className="mb-5 text-sm text-muted-foreground">
            This page crashed. Please refresh. If it keeps happening, the console will show the exact error.
          </div>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Refresh
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

