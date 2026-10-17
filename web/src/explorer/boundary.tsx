import { Component, Fragment, type ErrorInfo, type ReactNode } from 'react';

interface State {
  error: Error | null;
  attempt: number;
}

/**
 * Last line of defence: an error while rendering (or in an effect) must not blank the explorer.
 * Shows what happened and remounts the app on "Try again".
 */
export class ExplorerBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null, attempt: 0 };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('connect-the-dot explorer: recovered from an error', error, info.componentStack);
  }

  render(): ReactNode {
    const { error, attempt } = this.state;
    if (error) {
      return (
        <div className="ctdx ctdx-state" role="alert">
          <p>Something went wrong while drawing the explorer.</p>
          <p className="ctdx-note">{error.message || String(error)}</p>
          <button type="button" className="ctdx-btn" onClick={() => this.setState({ error: null, attempt: attempt + 1 })}>
            Try again
          </button>
        </div>
      );
    }
    return <Fragment key={attempt}>{this.props.children}</Fragment>;
  }
}
