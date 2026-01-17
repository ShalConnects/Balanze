import React, { ReactNode } from 'react';

interface AccordionWidgetProps {
  id: string;
  children: ReactNode;
  isExpanded: boolean;
}

export const AccordionWidget: React.FC<AccordionWidgetProps> = ({
  id,
  children,
  isExpanded,
}) => {
  // Always render children - widgets handle their own content visibility based on isAccordionExpanded prop
  return (
    <div className="overflow-hidden">
      <div
        id={`accordion-content-${id}`}
        className="overflow-hidden"
        role="region"
      >
        {children}
      </div>
    </div>
  );
};
