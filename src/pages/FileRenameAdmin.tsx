import React from 'react';
import { MainLayout } from '../components/Layout/MainLayout';
import { FileRenameUtility } from '../components/Admin/FileRenameUtility';
import { Settings } from 'lucide-react';

export const FileRenameAdmin: React.FC = () => {
  return (
    <MainLayout>
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Settings className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              File Rename Utility
            </h1>
          </div>
          <FileRenameUtility />
        </div>
      </div>
    </MainLayout>
  );
};
