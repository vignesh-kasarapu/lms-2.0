import client from './client';

export const listHolidays = () => client.get('/holidays');
export const getOptionalHolidaySummary = (leaveYearId) => client.get('/holidays/optional-summary', { params: { leaveYearId } });
export const selectOptionalHoliday = (holidayId) => client.post(`/holidays/${holidayId}/select`);
export const deselectOptionalHoliday = (holidayId) => client.delete(`/holidays/${holidayId}/select`);
