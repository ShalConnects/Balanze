import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Upload, X, FileText, Image, File } from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { PurchaseAttachment } from '../../types';
// Quill editor loaded dynamically to reduce initial bundle size
// import ReactQuill from 'react-quill';
// import 'react-quill/dist/quill.snow.css';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface PurchaseDetailsSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  priority: 'low' | 'medium' | 'high';
  onPriorityChange: (priority: 'low' | 'medium' | 'high') => void;
  notes: string;
  onNotesChange: (notes: string) => void;
  attachments: PurchaseAttachment[];
  onAttachmentsChange: (attachments: PurchaseAttachment[]) => void;
  showPriority?: boolean;
  showClearButtonForNotes?: boolean;
}

export const PurchaseDetailsSection: React.FC<PurchaseDetailsSectionProps> = ({
  isExpanded,
  onToggle,
  priority,
  onPriorityChange,
  notes,
  onNotesChange,
  attachments,
  onAttachmentsChange,
  showPriority = true,
  showClearButtonForNotes = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUploadFile, setCurrentUploadFile] = useState<string | null>(null);
  const notesEditorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<any>(null);
  const [ReactQuill, setReactQuill] = useState<any>(null);
  const [quillLoading, setQuillLoading] = useState(false);

  // Lazy load Quill editor when section is expanded
  useEffect(() => {
    if (isExpanded && !ReactQuill && !quillLoading) {
      setQuillLoading(true);
          Promise.all([
            import('react-quill'),
            import('react-quill/dist/quill.snow.css'),
            import('../../styles/quill-custom.css')
          ]).then(([quillModule]) => {
        setReactQuill(() => quillModule.default);
        setQuillLoading(false);
      }).catch(() => {
        setQuillLoading(false);
      });
    }
  }, [isExpanded, ReactQuill, quillLoading]);

  // Sync notes prop to contentEditable only when it changes
  useEffect(() => {
    if (notesEditorRef.current && notesEditorRef.current.innerHTML !== notes) {
      notesEditorRef.current.innerHTML = notes || '';
    }
  }, [notes]);

  const simulateUploadProgress = (fileName: string) => {
    setCurrentUploadFile(fileName);
    setUploadProgress(0);
    
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setCurrentUploadFile(null);
          setUploadProgress(0);
          return 100;
        }
        return prev + Math.random() * 15 + 5; // Random progress increment
      });
    }, 100);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setUploading(true);
    
    // Start upload progress simulation
    simulateUploadProgress(file.name);

    try {
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

      // Generate random file name
      const originalExtension = '.' + (file.name.split('.').pop() || '');
      const randomFileName = generateRandomFileName(originalExtension);

      // For now, we'll create a temporary attachment object
      // In a real implementation, you'd upload to storage and get the actual attachment
      const tempAttachment: PurchaseAttachment = {
        id: `temp_${Date.now()}`,
        purchase_id: 'temp',
        user_id: 'temp',
        file_name: randomFileName,
        file_path: URL.createObjectURL(file), // for preview only
        file_size: file.size,
        file_type: file.name.split('.').pop()?.toLowerCase() || '',
        mime_type: file.type,
        created_at: new Date().toISOString(),
        file: file // store the actual File object
      };

      onAttachmentsChange([...attachments, tempAttachment]);
    } catch (error) {

      setCurrentUploadFile(null);
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    // If it's a real attachment (not temp_), remove from database
    if (!attachmentId.startsWith('temp_')) {
      // Remove from database
      supabase
        .from('purchase_attachments')
        .delete()
        .eq('id', attachmentId)
        .then(({ error }) => {
          if (error) {

          }
        });
    }
    
    onAttachmentsChange(attachments.filter(att => att.id !== attachmentId));
  };

  const generateRandomFileName = (originalExtension: string) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const length = Math.floor(Math.random() * 3) + 5; // Random length between 5-7
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result + originalExtension;
  };

  const getFileIcon = (fileType: string) => {
    if (['jpg', 'jpeg', 'png', 'gif'].includes(fileType)) {
      return <Image className="w-4 h-4" />;
    } else if (fileType === 'pdf') {
      return <FileText className="w-4 h-4" />;
    } else {
      return <File className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle attachment download
  const handleDownloadAttachment = async (filePath: string, fileName: string) => {
    try {
      // Fetch the file from the URL
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }
      
      // Get the blob data
      const blob = await response.blob();
      
      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary anchor element and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {

      toast.error('Failed to download file. Please try again.');
    }
  };

  const RichTextToolbar: React.FC<{ editorRef: React.RefObject<HTMLDivElement> }> = ({ editorRef }) => (
  <div className="flex gap-2 mb-2">
    <button type="button" title="Bold" onClick={() => document.execCommand('bold')} className="px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 font-bold text-gray-700 dark:text-gray-200">B</button>
    <button type="button" title="Italic" onClick={() => document.execCommand('italic')} className="px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 italic text-gray-700 dark:text-gray-200">I</button>
    <button type="button" title="Underline" onClick={() => document.execCommand('underline')} className="px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 underline text-gray-700 dark:text-gray-200">U</button>
    <button type="button" title="Bulleted List" onClick={() => document.execCommand('insertUnorderedList')} className="px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">• List</button>
    <button type="button" title="Numbered List" onClick={() => document.execCommand('insertOrderedList')} className="px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">1. List</button>
  </div>
);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between text-left bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-t-lg"
      >
        <span className="font-medium text-gray-700 dark:text-gray-200" style={{ fontSize: '14px' }}>Purchase Details (optional)</span>
        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>

      {isExpanded && (
        <div className="p-4 space-y-4 bg-white dark:bg-gray-900 rounded-b-lg">
          {/* Priority - only show if showPriority is true */}
          {showPriority && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Priority
              </label>
              <div className="flex gap-4">
                {(['low', 'medium', 'high'] as const).map((p) => (
                  <label key={p} className="inline-flex items-center">
                    <input
                      type="radio"
                      value={p}
                      checked={priority === p}
                      onChange={() => onPriorityChange(p)}
                      className="form-radio text-blue-600 dark:bg-gray-800 dark:border-gray-600 dark:checked:bg-blue-500 dark:checked:border-blue-500"
                    />
                    <span className="ml-2 capitalize text-gray-700 dark:text-gray-200">{p}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="relative">
            <style>{`
  .dark .ql-container {
    background-color: #1f2937 !important; /* Tailwind gray-800 */
    color: #f3f4f6 !important; /* Tailwind gray-100 */
    border-color: #374151 !important; /* Tailwind gray-700 */
  }
  .dark .ql-editor {
    background-color: #1f2937 !important;
    color: #f3f4f6 !important;
  }
  .dark .ql-toolbar {
    background-color: #111827 !important; /* Tailwind gray-900 */
    border-color: #374151 !important;
  }
`}</style>
            {ReactQuill ? (
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={notes}
                onChange={onNotesChange}
                placeholder="Take a note..."
                modules={{
                  toolbar: [
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['clean']
                  ]
                }}
                className="quill-form-field dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
              />
            ) : (
              <textarea
                value={notes}
                onChange={(e) => onNotesChange(e.target.value)}
                placeholder="Take a note... (Loading rich editor...)"
                className="w-full min-h-[200px] p-3 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            )}
            {showClearButtonForNotes && notes && (
              <button
                type="button"
                className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 z-10"
                onClick={() => onNotesChange('')}
                tabIndex={-1}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Attachments */}
          <div>
            <div className="space-y-3">
              {/* Upload Button */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 transition-colors disabled:opacity-50 text-[13px]"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Uploading...' : 'Upload File'}
                </button>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Max 5MB • JPG, PNG, GIF, PDF, DOCX, XLSX, TXT
                </span>
              </div>

              {/* Upload Progress */}
              {currentUploadFile && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Uploading: {currentUploadFile}
                    </span>
                    <span className="text-sm text-blue-600 dark:text-blue-400">
                      {Math.round(uploadProgress)}%
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                    <div 
                      className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.gif,.pdf,.docx,.xlsx,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Attachments List */}
              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center gap-3">
                        {getFileIcon(attachment.file_type)}
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                            {attachment.file_name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatFileSize(attachment.file_size)}
                          </p>
                        </div>
                        <div className="ml-2 flex gap-2">
                          <a
                            href={attachment.file_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 underline text-xs hover:text-blue-700 dark:hover:text-blue-300"
                          >
                            View
                          </a>
                          <button
                            onClick={() => handleDownloadAttachment(attachment.file_path, attachment.file_name)}
                            className="text-blue-600 dark:text-blue-400 underline text-xs hover:text-blue-700 dark:hover:text-blue-300"
                          >
                            Download
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(attachment.id)}
                        className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 

