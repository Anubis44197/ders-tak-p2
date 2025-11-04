import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from '../icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true, 
      error,
      errorInfo: null 
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Update state with error info
    this.setState({
      error,
      errorInfo
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to external service (optional)
    this.logErrorToService(error, errorInfo);
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // Bu kısımda isterseniz external logging service kullanabilirsiniz
    // Örneğin: Sentry, LogRocket, etc.
    try {
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };
      
      console.warn('Error Report:', errorReport);
      
      // localStorage'a kaydet (debugging için)
      const existingErrors = JSON.parse(localStorage.getItem('app_errors') || '[]');
      existingErrors.push(errorReport);
      
      // Son 10 hatayı sakla
      if (existingErrors.length > 10) {
        existingErrors.shift();
      }
      
      localStorage.setItem('app_errors', JSON.stringify(existingErrors));
    } catch (logError) {
      console.error('Error logging failed:', logError);
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    // State'i temizle ve ana sayfaya dön
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.hash = '';
  };

  private handleRetry = () => {
    // Sadece error state'ini temizle, component'i yeniden render et
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private getErrorDetails = () => {
    const { error, errorInfo } = this.state;
    
    if (!error) return 'Bilinmeyen hata';
    
    // Türkçe hata mesajları
    const errorMessages: { [key: string]: string } = {
      'ChunkLoadError': 'Uygulama dosyaları yüklenemedi. Sayfayı yenilemeyi deneyin.',
      'TypeError': 'Veri işleme hatası. Lütfen daha sonra tekrar deneyin.',
      'ReferenceError': 'Uygulama bileşeni bulunamadı. Sayfayı yenileyin.',
      'NetworkError': 'İnternet bağlantısı sorunu. Bağlantınızı kontrol edin.',
      'Firebase': 'Veritabanı bağlantısı sorunu. Lütfen daha sonra deneyin.'
    };
    
    // Error message'da anahtar kelime arama
    for (const [key, message] of Object.entries(errorMessages)) {
      if (error.message.includes(key) || error.name.includes(key)) {
        return message;
      }
    }
    
    return error.message || 'Beklenmeyen bir hata oluştu';
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI varsa onu kullan
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            
            <h1 className="text-xl font-bold text-slate-800 mb-2">
              Bir sorun oluştu
            </h1>
            
            <p className="text-slate-600 mb-6">
              {this.getErrorDetails()}
            </p>
            
            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition flex items-center justify-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Tekrar Dene
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="w-full bg-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-300 transition flex items-center justify-center"
              >
                <Home className="w-4 h-4 mr-2" />
                Ana Sayfaya Dön
              </button>
              
              <button
                onClick={this.handleReload}
                className="w-full text-slate-500 px-4 py-2 rounded-lg hover:text-slate-700 transition text-sm"
              >
                Sayfayı Yenile
              </button>
            </div>
            
            {/* Debug bilgileri - sadece development'ta göster */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-sm text-slate-500 cursor-pointer hover:text-slate-700">
                  Teknik Detaylar
                </summary>
                <pre className="mt-2 p-3 bg-slate-100 rounded text-xs overflow-auto max-h-40 text-slate-600">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// HOC version - component'leri wrap etmek için
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Hook version - functional component'lerde kullanım için
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error: Error) => {
    setError(error);
    console.error('Error caught by useErrorHandler:', error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { handleError, resetError };
};