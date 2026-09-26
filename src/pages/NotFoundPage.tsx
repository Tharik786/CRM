import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { LayoutDashboard } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <span className="font-mono font-black text-6xl text-brand-600 block mb-2">404</span>
        <h2 className="text-xl font-bold text-slate-900">Module Page Not Found</h2>
        <p className="text-xs text-slate-500 mt-2 mb-6">
          The CRM route or entity you are looking for does not exist or may have been reorganized.
        </p>
        <Link to="/dashboard">
          <Button variant="primary" size="md" icon={<LayoutDashboard className="w-4 h-4" />}>
            Return to Today Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};
