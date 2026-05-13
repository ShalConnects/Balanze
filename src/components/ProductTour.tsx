export interface ProductTourProps {
  stepToStart?: string | null;
  onClose?: () => void;
  isOpen?: boolean;
}

/** Product Joyride is disabled; keep a stable shell so callers stay unchanged. */
export default function ProductTour(_props: ProductTourProps) {
  return null;
}
