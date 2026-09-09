import client from './client';

export const listHolidays = () => client.get('/holidays');
