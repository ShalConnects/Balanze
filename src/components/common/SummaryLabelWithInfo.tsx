import React from 'react';
import { Info } from 'lucide-react';
import { Tooltip } from './Tooltip';

type Props = { label: string; tooltip: string };

export const SummaryLabelWithInfo: React.FC<Props> = ({ label, tooltip }) => (
  <div className="flex items-center gap-1">
    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</p>
    <Tooltip content={tooltip} placement="top">
      <Info className="w-3 h-3 text-gray-400 cursor-help" />
    </Tooltip>
  </div>
);
