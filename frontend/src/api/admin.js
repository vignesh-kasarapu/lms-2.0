import client from './client';

export const listDepartments = () => client.get('/admin/departments');
export const createDepartment = (payload) => client.post('/admin/departments', payload);
export const listManagementLevels = () => client.get('/admin/management-levels');

export const listGrades = () => client.get('/admin/grades');
export const createGrade = (payload) => client.post('/admin/grades', payload);

export const listProjects = () => client.get('/admin/projects');
export const createProject = (payload) => client.post('/admin/projects', payload);
export const assignProject = (payload) => client.post('/admin/project-assignments', payload);

export const listLeaveTypes = () => client.get('/admin/leave-types');
export const createLeaveType = (payload) => client.post('/admin/leave-types', payload);
export const updateLeaveTypePolicy = (leaveTypeId, payload) => client.patch(`/admin/leave-types/${leaveTypeId}/policy`, payload);

export const listHolidays = (leaveYearId) => client.get('/admin/holidays', { params: { leaveYearId } });
export const addHoliday = (payload) => client.post('/admin/holidays', payload);
export const removeHoliday = (holidayId) => client.delete(`/admin/holidays/${holidayId}`);

export const listSelfApprovalGrants = () => client.get('/admin/self-approval-permissions');
export const grantSelfApproval = (payload) => client.post('/admin/self-approval-permissions', payload);
export const revokeSelfApproval = (grantId) => client.post(`/admin/self-approval-permissions/${grantId}/revoke`);

export const listWorkingPatterns = () => client.get('/admin/working-patterns');
export const createWorkingPattern = (payload) => client.post('/admin/working-patterns', payload);
export const assignWorkingPattern = (payload) => client.post('/admin/working-pattern-assignments', payload);

export const listNotificationTemplates = () => client.get('/admin/notification-templates');
export const updateNotificationTemplate = (templateKey, payload) => client.patch(`/admin/notification-templates/${templateKey}`, payload);

export const listBlackoutPeriods = () => client.get('/r3/blackout-periods');
export const createBlackoutPeriod = (payload) => client.post('/r3/blackout-periods', payload);
export const deactivateBlackoutPeriod = (id) => client.post(`/r3/blackout-periods/${id}/deactivate`);
export const createTeamCapacityLimit = (payload) => client.post('/r3/team-capacity-limits', payload);

export const createEncashment = (payload) => client.post('/r3/leave-encashment', payload);
export const creditCompOff = (payload) => client.post('/r3/comp-off', payload);
export const listLeaveTypesShort = () => client.get('/admin/leave-types');
