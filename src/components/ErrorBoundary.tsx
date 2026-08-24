import React, { Component, ReactNode, ErrorInfo } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  info: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    info: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, info: null };
  }

  public componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Uncaught error:", error, info);
    this.setState({ error, info });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, background: '#fee', color: '#a00' }}>
          <h2>Something went wrong.</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error?.toString()}</pre>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.info?.componentStack}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}
