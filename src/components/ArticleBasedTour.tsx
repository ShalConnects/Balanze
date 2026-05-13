import type { Step } from 'react-joyride';

export interface ArticleBasedTourProps {
  articleSlug?: string;
  onClose?: () => void;
  isOpen?: boolean;
  customSteps?: Step[];
}

/** Article-linked Joyride is disabled; keep a stable shell so callers stay unchanged. */
export default function ArticleBasedTour(_props: ArticleBasedTourProps) {
  return null;
}
