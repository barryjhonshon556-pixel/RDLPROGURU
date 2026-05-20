'use client';

import { useState, useEffect, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { BarChart3, Home, LogOut, Clock, ClipboardList } from 'lucide-react';
import { getClientISTDate } from '@/lib/ist-date';
import PostResult from './PostResult';
import EditAllSlots from './EditAllSlots';
import MonthlyCharts from './MonthlyCharts';
import SiteSettings from './SiteSettings';
import ResultHistoryLog from './ResultHistoryLog';

interface AdminLayoutProps {
  children?: ReactNode;
  onLogout: () => void;
  onHome: () => void;
}

type TabKey = 'post-result' | 'edit-slots' | 'monthly-charts' | 'site-settings' | 'result-log';

const TABS: { key: TabKey; label: string; icon?: ReactNode }[] = [
  { key: 'post-result', label: 'Post Result' },
  { key: 'edit-slots', label: 'Edit All Slots' },
  { key: 'monthly-charts', label: 'Monthly Charts' },
  { key: 'site-settings', label: 'Site Settings' },
  { key: 'result-log', label: 'Result Log', icon: <ClipboardList className="size-3.5" /> },
];

export default function AdminLayout({ onLogout, onHome }: AdminLayoutProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('post-result');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const ist = getClientISTDate();
      const hour12 = ist.hour % 12 || 12;
      const ampm = ist.hour >= 12 ? 'PM' : 'AM';
      setCurrentTime(
        `${String(hour12).padStart(2, '0')}:${String(ist.minute).padStart(2, '0')}:${String(ist.second).padStart(2, '0')} ${ampm}`
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'post-result':
        return <PostResult />;
      case 'edit-slots':
        return <EditAllSlots />;
      case 'monthly-charts':
        return <MonthlyCharts />;
      case 'site-settings':
        return <SiteSettings />;
      case 'result-log':
        return <ResultHistoryLog />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-purple-500 to-indigo-700 p-3 sm:p-6">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 sm:p-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <BarChart3 className="size-6 text-purple-600" />
            <h1 className="text-xl font-bold text-gray-800">RDL PRO Admin</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 text-sm text-gray-500 mr-auto sm:mr-3">
              <Clock className="size-4" />
              <span className="font-mono tabular-nums">{currentTime}</span>
            </div>
            <Button
              onClick={onHome}
              variant="outline"
              size="sm"
              className="bg-pink-500 hover:bg-pink-600 text-white border-0"
            >
              <Home className="size-3.5 mr-1" />
              Home
            </Button>
            <Button
              onClick={onLogout}
              variant="outline"
              size="sm"
              className="bg-red-500 hover:bg-red-600 text-white border-0"
            >
              <LogOut className="size-3.5 mr-1" />
              Logout
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-100">
          <div className="flex overflow-x-auto px-4 sm:px-6">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === tab.key
                    ? 'text-purple-600 border-purple-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
