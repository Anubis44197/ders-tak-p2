import React, { ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

// Basit Error Boundary - Geliştirme aşamasında kullanım için
const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({ children, fallback }) => {
  // Not: Bu basit implementation sadece development için
  // Production'da react-error-boundary kütüphanesi kullanmak daha iyi olur
  
  try {
    return <>{children}</>;
  } catch (error) {
    console.error('ErrorBoundary caught an error:', error);
    
    return fallback || (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            Bir şeyler ters gitti
          </h2>
          <p className="text-slate-600 mb-4">
            Beklenmeyen bir hata oluştu. Sayfayı yenilemeyi deneyin.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition"
          >
            Sayfayı Yenile
          </button>
        </div>
      </div>
    );
  }
};

export default ErrorBoundary;