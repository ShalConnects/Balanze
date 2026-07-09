import React, { useEffect, useState } from 'react';
import { Download, ExternalLink, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import {
  createInvestmentAgreementPdfBlob,
  downloadInvestmentAgreementPdf,
  type InvestmentAgreementPdfInput
} from '../../utils/investmentAgreementPdf';

export interface InvestmentAgreementPreviewModalProps {
  open: boolean;
  input: InvestmentAgreementPdfInput | null;
  onClose: () => void;
}

const PreviewFallback: React.FC<{
  filename: string;
  onOpen: () => void;
  onDownload: () => void;
  downloading: boolean;
}> = ({ filename, onOpen, onDownload, downloading }) => (
  <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
    <p className="text-sm text-gray-600 dark:text-gray-300 max-w-sm">
      Inline PDF preview is limited on this device. Open the agreement in your browser or download it.
    </p>
    <div className="flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        onClick={onOpen}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
      >
        <ExternalLink className="w-4 h-4" />
        Open in new tab
      </button>
      <button
        type="button"
        onClick={onDownload}
        disabled={downloading}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
      >
        {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        Download
      </button>
    </div>
    {filename ? <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-full">{filename}</p> : null}
  </div>
);

export const InvestmentAgreementPreviewModal: React.FC<InvestmentAgreementPreviewModalProps> = ({
  open,
  input,
  onClose
}) => {
  const { isMobile } = useMobileDetection();
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!open || !input) {
      setBlobUrl(null);
      setError(null);
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;

    (async () => {
      setLoading(true);
      setError(null);
      const result = await createInvestmentAgreementPdfBlob(input);
      if (cancelled) return;
      if (!result.success) {
        setError(result.error);
        setLoading(false);
        return;
      }
      objectUrl = URL.createObjectURL(result.data.blob);
      setBlobUrl(objectUrl);
      setFilename(result.data.filename);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setBlobUrl(null);
    };
  }, [open, input?.contract.id, input?.investorName, input?.investorEmail]);

  if (!open || !input) return null;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const result = await downloadInvestmentAgreementPdf(input);
      if (result.success) toast.success('Agreement PDF downloaded');
      else toast.error(result.error ?? 'Failed to download PDF');
    } finally {
      setDownloading(false);
    }
  };

  const openInBrowser = () => {
    if (!blobUrl) return;
    window.open(blobUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div
        className="relative flex flex-col w-full max-w-4xl h-[min(90vh,820px)] bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-semibold truncate">Agreement preview</h3>
            <p className="text-xs text-blue-100 truncate">{input.contract.title}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {blobUrl ? (
              <button
                type="button"
                onClick={openInBrowser}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-lg text-white/90 hover:bg-white/10"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">Open</span>
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleDownload}
              disabled={loading || downloading || Boolean(error)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-lg text-white/90 hover:bg-white/10 disabled:opacity-50"
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
              aria-label="Close preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col bg-gray-100 dark:bg-gray-950">
          {loading ? (
            <div className="flex flex-1 items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating preview…
            </div>
          ) : error ? (
            <div className="flex flex-1 items-center justify-center p-6 text-sm text-red-600 dark:text-red-400 text-center">
              {error}
            </div>
          ) : blobUrl && isMobile ? (
            <PreviewFallback
              filename={filename}
              onOpen={openInBrowser}
              onDownload={handleDownload}
              downloading={downloading}
            />
          ) : blobUrl ? (
            <iframe
              title="Investment agreement preview"
              src={`${blobUrl}#toolbar=0`}
              className="w-full h-full min-h-0 border-0 bg-white"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};
