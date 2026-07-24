/** Shared dashboard sidebar widget chrome (matches Client Task / TaskReminders). */

export const DASHBOARD_WIDGET_SHELL =
  'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200/50 dark:border-blue-800/50 shadow-sm relative group';

/** Fixed header band (h-9); chrome centers at half-height so expand/drag stay aligned when collapsed. */
export const DASHBOARD_WIDGET_DRAG_CLEAR_RIGHT = 'pr-9';

export const DASHBOARD_WIDGET_HEADER =
  `flex items-center justify-between gap-2 h-9 pl-9 ${DASHBOARD_WIDGET_DRAG_CLEAR_RIGHT} sm:px-4`;

export const DASHBOARD_WIDGET_HEADER_BORDER =
  'border-b border-blue-200/50 dark:border-blue-800/50';

export const DASHBOARD_WIDGET_TITLE =
  'text-[1rem] font-bold text-gray-900 dark:text-white flex-shrink-0';

export const DASHBOARD_WIDGET_VIEW_ALL =
  'text-[0.8rem] font-medium flex items-center space-x-1 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-700 transition-all duration-200 whitespace-nowrap flex-shrink-0 touch-manipulation';

export const DASHBOARD_WIDGET_BADGE =
  'px-1 py-px rounded text-[9px] font-medium leading-none';

export const DASHBOARD_WIDGET_CONTENT = 'px-2 sm:px-3';

export const DASHBOARD_WIDGET_ROW =
  'flex items-stretch gap-1.5 border-b border-blue-200/40 dark:border-blue-800/40 last:border-0';

/** Half of header `h-9` (1.125rem) — centers in the title bar, not the full card. */
const DASHBOARD_WIDGET_CHROME_BTN =
  'absolute z-10 top-[1.125rem] -translate-y-1/2 p-1.5 rounded-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 touch-manipulation transition-opacity';

export const DASHBOARD_WIDGET_ACCORDION_BTN = `${DASHBOARD_WIDGET_CHROME_BTN} left-2`;

export const DASHBOARD_WIDGET_DRAG_BTN =
  `${DASHBOARD_WIDGET_CHROME_BTN} right-2 cursor-grab active:cursor-grabbing hover:bg-white dark:hover:bg-gray-800`;

/** Clip only while collapsed so absolute menus (e.g. duration picker) aren't cut off. */
export const taskAccordionShell = (expanded: boolean, dragOver = false) =>
  `rounded-lg transition-all${expanded ? '' : ' overflow-hidden'}${
    dragOver
      ? ' bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40'
      : ''
  }`;

export const taskAccordionBody = (expanded: boolean) =>
  `transition-all duration-300 ease-in-out ${
    expanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
  }`;

/** Shared height for duration + pomodoro count pills on task rows. */
export const TASK_POMODORO_BADGE =
  'inline-flex items-center justify-center h-5 px-1.5 text-xs leading-none rounded';
