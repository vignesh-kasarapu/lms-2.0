import client from './client';

export const getLeaveTakenReport = (params) => client.get('/reports/leave-taken', { params });
export const getLopReport = (params) => client.get('/reports/lop', { params });
export const getBalancesReport = (params) => client.get('/reports/balances', { params });
export const getAuditLog = (params) => client.get('/reports/audit-log', { params });
