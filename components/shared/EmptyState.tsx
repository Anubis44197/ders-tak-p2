import React from 'react';
import { BarChart as BarChartIcon } from '../icons';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  message: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-10 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 h-full">
      <div className="w-16 h-16 mb-4 flex items-center justify-center bg-slate-200 rounded-full">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-700">{title}</h3>
      <p className="text-slate-500 max-w-xs">{message}</p>
    </div>
  );
};

export default EmptyState;
