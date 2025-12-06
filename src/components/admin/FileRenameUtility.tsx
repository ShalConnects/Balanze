import React, { useState } from 'react';
import { FileText, Play, Eye, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { renameCurrentUserFiles, previewFileRename } from '../../utils/renameExistingFiles';
import { useAuthStore } from '../../store/authStore';

interface PreviewFile {
  currentName: string;
  newName: string;
  purchaseId: string;
  fileSize: number;
}

interface RenameResult {
  success: number;
  failed: number;
  total: number;
  errors: string[];
}

export const FileRenameUtility: React.FC = () => {
  const { user } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<PreviewFile[]>([]);
  const [renameResult, setRenameResult] = useState<RenameResult | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handlePreview = async () => {
    if (!user) return;
    
    setIsProcessing(true);
    try {
      const preview = await previewFileRename(user.id);
      setPreviewFiles(preview.files);
      setShowPreview(true);
    } catch (error) {

    } finally {
      setIsProcessing(false);
    }
  };

  const handleRename = async () => {
    if (!user) return;
    
    setIsProcessing(true);
    setRenameResult(null);
    
    try {
      const result = await renameCurrentUserFiles();
      setRenameResult(result);
      setShowPreview(false);
    } catch (error) {

      setRenameResult({
        success: 0,
        failed: 0,
        total: 0,
        errors: [`Fatal error: ${error}`]
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!user) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="text-gray-600 dark:text-gray-400">Please log in to use this utility.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          File Rename Utility
        </h2>
      </div>

      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-400">
          This utility will rename all your existing uploaded files to random 5-7 character names while preserving file extensions.
        </p>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handlePreview}
            disabled={isProcessing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Eye className="w-4 h-4" />
            {isProcessing ? 'Loading...' : 'Preview Changes'}
          </button>

          <button
            onClick={handleRename}
            disabled={isProcessing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-primary text-white rounded-lg hover:bg-gradient-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Play className="w-4 h-4" />
            {isProcessing ? 'Processing...' : 'Rename All Files'}
          </button>
        </div>

        {/* Warning */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Warning:</strong> This action cannot be undone. All your uploaded files will be renamed to random names. 
            Make sure to preview the changes first.
          </div>
        </div>

        {/* Preview Results */}
        {showPreview && previewFiles.length > 0 && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2 border-b border-gray-200 dark:border-gray-600">
              <h3 className="font-medium text-gray-900 dark:text-white">
                Preview: {previewFiles.length} files will be renamed
              </h3>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {previewFiles.slice(0, 10).map((file, index) => (
                <div key={index} className="px-4 py-3 border-b border-gray-100 dark:border-gray-600 last:border-b-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {file.currentName} → {file.newName}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatFileSize(file.fileSize)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {previewFiles.length > 10 && (
                <div className="px-4 py-2 text-center text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700">
                  ... and {previewFiles.length - 10} more files
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rename Results */}
        {renameResult && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2 border-b border-gray-200 dark:border-gray-600">
              <h3 className="font-medium text-gray-900 dark:text-white">Rename Results</h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-900 dark:text-white">
                  Successfully renamed: <strong>{renameResult.success}</strong> files
                </span>
              </div>
              
              {renameResult.failed > 0 && (
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="text-sm text-gray-900 dark:text-white">
                    Failed to rename: <strong>{renameResult.failed}</strong> files
                  </span>
                </div>
              )}

              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total processed: {renameResult.total} files
              </div>

              {renameResult.errors.length > 0 && (
                <div className="mt-3">
                  <details className="text-sm">
                    <summary className="cursor-pointer text-red-600 dark:text-red-400 font-medium">
                      View Errors ({renameResult.errors.length})
                    </summary>
                    <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                      {renameResult.errors.map((error, index) => (
                        <div key={index} className="text-red-700 dark:text-red-300 text-xs">
                          {error}
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

