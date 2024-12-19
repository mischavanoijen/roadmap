export const currentYear = new Date().getFullYear();

export const quarterDates = [
  { quarter: 'Q1', startDate: new Date(currentYear, 0, 1), endDate: new Date(currentYear, 2, 31) },
  { quarter: 'Q2', startDate: new Date(currentYear, 3, 1), endDate: new Date(currentYear, 5, 30) },
  { quarter: 'Q3', startDate: new Date(currentYear, 6, 1), endDate: new Date(currentYear, 8, 30) },
  { quarter: 'Q4', startDate: new Date(currentYear, 9, 1), endDate: new Date(currentYear, 11, 31) },
] as const;