import React from 'react';

// Professional Weather-themed Error Fallback Component
const ErrorBoundaryFallback = ({ error, onReload }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header with weather icon */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-center">
          <div className="text-6xl mb-4 animate-pulse">⛈️</div>
          <h1 className="text-2xl font-bold text-white mb-2">Weather System Error</h1>
          <p className="text-blue-100 text-sm">PAGASA Weather Forecasting</p>
        </div>
        
        {/* Error content */}
        <div className="px-6 py-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-3">
              Unexpected Storm Detected
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Our weather monitoring systems have encountered an unexpected condition. 
              This temporary disruption doesn't affect the actual weather—just our app!
            </p>
          </div>
          
          {/* Error details (collapsible) */}
          <details className="mb-6 bg-slate-50 rounded-lg border border-slate-200">
            <summary className="px-4 py-3 text-sm font-medium text-slate-700 cursor-pointer hover:bg-slate-100 rounded-lg transition-colors">
              Technical Details
            </summary>
            <div className="px-4 py-3 border-t border-slate-200">
              <pre className="text-xs text-slate-600 bg-slate-100 p-3 rounded overflow-auto max-h-32">
                {error?.toString() || 'Unknown error occurred'}
              </pre>
            </div>
          </details>
          
          {/* Action buttons */}
          <div className="space-y-3">
            <button
              onClick={onReload}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
            >
              🔄 Restart Weather System
            </button>
            
            <button
              onClick={() => window.history.back()}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-4 rounded-xl transition-all duration-200 border border-slate-300"
            >
              ← Go Back
            </button>
          </div>
          
          {/* Footer info */}
          <div className="mt-6 pt-4 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-500">
              If this persists, contact PAGASA technical support
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Error Boundary Class Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      timestamp: null
    };
  }

  static getDerivedStateFromError(error) {
    return { 
      hasError: true, 
      error,
      timestamp: new Date().toISOString()
    };
  }

  componentDidCatch(error, errorInfo) {
    // Enhanced error logging for PAGASA weather app
    console.group('🌪️ PAGASA Weather App Error');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Timestamp:', new Date().toISOString());
    console.error('User Agent:', navigator.userAgent);
    console.error('URL:', window.location.href);
    console.groupEnd();

    // Store additional error info
    this.setState({ errorInfo });

    // Optional: Send error to logging service
    // this.logErrorToService(error, errorInfo);
  }

  logErrorToService = (error, errorInfo) => {
    // Example error reporting - replace with your actual service
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: this.state.timestamp,
      url: window.location.href,
      userAgent: navigator.userAgent,
      appVersion: '1.0.0', // Replace with your app version
      service: 'PAGASA Weather Forecasting'
    };
    
    // Send to your error tracking service (e.g., Sentry, LogRocket, etc.)
    console.log('Error data to be sent:', errorData);
  };

  handleReload = () => {
    // Clear error state first, then reload
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorBoundaryFallback 
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReload={this.handleReload}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;