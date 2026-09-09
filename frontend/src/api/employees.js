import client from './client';

export const getMe = () => client.get('/employees/me');
export const getDashboard = () => client.get('/employees/dashboard');
export const getMyTeam = () => client.get('/employees/my-team');
export const getPeerCalendar = (params) => client.get('/employees/peer-calendar', { params });
export const listEmployees = (params) => client.get('/employees', { params });
export const createEmployee = (payload) => client.post('/employees', payload);
export const updateManager = (employeeId, managerId) =>
  client.patch(`/employees/${employeeId}/manager`, { managerId });
export const getWatchableEmployees = () => client.get('/employees/watchable');
export const listStandingWatchers = (employeeId) => client.get(`/employees/${employeeId}/standing-watchers`);
export const addStandingWatcher = (employeeId, payload) => client.post(`/employees/${employeeId}/standing-watchers`, payload);
export const deactivateEmployee = (employeeId, lastWorkingDay) =>
  client.post(`/employees/${employeeId}/deactivate`, { lastWorkingDay });
export const reassignManager = (employeeId, newManagerId, transferPendingRequests) =>
  client.post(`/employees/${employeeId}/reassign-manager`, { newManagerId, transferPendingRequests });
export const bulkImportEmployees = (file) => {
  const form = new FormData();
  form.append('file', file);
  return client.post('/employees/bulk-import', form, { headers: { 'Content-Type': 'multipart/form-data' } });
};
export const getMyDigestPreference = () => client.get('/employees/me/digest-preference');
export const setMyDigestPreference = (digestEnabled) => client.patch('/employees/me/digest-preference', { digestEnabled });
export const getEmployeeRoles = (employeeId) => client.get(`/employees/${employeeId}/roles`);
export const assignEmployeeRole = (employeeId, roleCode) => client.post(`/employees/${employeeId}/roles`, { roleCode });
export const revokeEmployeeRole = (employeeId, roleCode) => client.delete(`/employees/${employeeId}/roles`, { data: { roleCode } });
export const getTeamCalendar = (params) => client.get('/employees/team-calendar', { params });
