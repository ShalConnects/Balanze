export type AnalyticsPeriod = '1m' | '3m' | '6m' | '1y';

export const getAnalyticsPeriodRange = (period: AnalyticsPeriod, now = new Date()) => {
  let startDate: Date;
  let prevStartDate: Date;
  let prevEndDate: Date;

  if (period === '1m') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  } else if (period === '3m') {
    startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    prevStartDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    prevEndDate = new Date(now.getFullYear(), now.getMonth() - 3, 0, 23, 59, 59);
  } else if (period === '6m') {
    startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    prevStartDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    prevEndDate = new Date(now.getFullYear(), now.getMonth() - 6, 0, 23, 59, 59);
  } else {
    startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    prevStartDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  }

  return {
    startDate,
    endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
    prevStartDate,
    prevEndDate,
  };
};

export const getAnalyticsPeriodLabel = (period: AnalyticsPeriod) =>
  period === '1m' ? 'This Month' : period === '3m' ? 'Last 3 Months' : period === '6m' ? 'Last 6 Months' : 'Last Year';
