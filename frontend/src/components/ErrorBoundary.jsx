import React from 'react';
import { ErrorBoundaryFallback } from './styles/global';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorBoundaryFallback>
          <h2>🌪 Something went wrong</h2>
          <button onClick={() => window.location.reload()}>
            Reload Application
          </button>
        </ErrorBoundaryFallback>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
