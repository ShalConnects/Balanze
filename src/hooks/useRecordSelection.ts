import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

interface UseRecordSelectionOptions {
  records: any[];
  recordIdField?: string;
  onRecordFound?: (record: any) => void;
  scrollToRecord?: boolean;
}

export const useRecordSelection = ({
  records,
  recordIdField = 'id',
  onRecordFound,
  scrollToRecord = true
}: UseRecordSelectionOptions) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isFromSearch, setIsFromSearch] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedRecordRef = useRef<HTMLDivElement>(null);

  const urlSelectedId = searchParams.get('selected');
  const fromSearch = searchParams.get('from') === 'search';

  // Handle URL parameters and set up selection
  useEffect(() => {
    
    if (urlSelectedId && records.length > 0) {
      // Find the record by the specified field
      const record = records.find(r => r[recordIdField] === urlSelectedId);
      
      
      if (record) {
        setSelectedId(urlSelectedId);
        setSelectedRecord(record);
        setIsFromSearch(fromSearch);
        
        if (onRecordFound) {
          onRecordFound(record);
        }

        // Scroll to the selected record
        if (scrollToRecord && selectedRecordRef.current) {
          setTimeout(() => {
            selectedRecordRef.current?.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
          }, 100);
        }

        // Clear URL parameters after processing the selection
        setTimeout(() => {
          setSearchParams({}, { replace: true });
        }, 1000); // Small delay to ensure the selection is processed
      } else {
        // Record not found, clear selection
        clearSelection();
      }
    }
  }, [urlSelectedId, records, recordIdField, onRecordFound, scrollToRecord, fromSearch, setSearchParams]);

  // Handle selection changes when selectedId changes
  useEffect(() => {
    if (selectedId && records.length > 0) {
      const record = records.find(r => r[recordIdField] === selectedId);
      if (record) {
        setSelectedRecord(record);
      }
    } else {
      setSelectedRecord(null);
      setIsFromSearch(false);
    }
  }, [selectedId, records, recordIdField]);

  const clearSelection = useCallback(() => {
    setSelectedId(null);
    setSelectedRecord(null);
    setIsFromSearch(false);
    setSearchParams({}, { replace: true }); // Clear all search params
    navigate(window.location.pathname, { replace: true }); // Clear URL without navigating away
  }, [setSearchParams, navigate]);

  const selectRecord = (recordId: string, fromSearch = false) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('selected', recordId);
      if (fromSearch) {
        newParams.set('from', 'search');
      } else {
        newParams.delete('from');
      }
      return newParams;
    });
  };

  return {
    selectedRecord,
    selectedId,
    isFromSearch,
    selectedRecordRef,
    clearSelection,
    selectRecord,
    hasSelection: !!selectedRecord
  };
};
