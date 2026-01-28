import { ReactNode } from 'react';
import { Download } from 'lucide-react';

interface BIPageLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  onExport?: () => void;
  exportEnabled?: boolean;
}

export function BIPageLayout({
  title,
  subtitle,
  children,
  onExport,
  exportEnabled = false,
}: BIPageLayoutProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>
        </div>
        <button
          onClick={onExport}
          disabled={!exportEnabled}
          className={`btn ${
            exportEnabled
              ? 'btn-primary'
              : 'btn-outline opacity-50 cursor-not-allowed'
          } flex items-center space-x-2`}
          title={exportEnabled ? 'Export Report' : 'Export coming soon'}
        >
          <Download className="w-5 h-5" />
          <span>Export Report</span>
        </button>
      </div>
      {children}
    </div>
  );
}
