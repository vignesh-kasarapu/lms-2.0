import client from './client';

export const subscribeCalendarFeed = (scope) => client.post('/r3/calendar-feed/subscribe', { scope });
export const listCalendarFeedSubscriptions = () => client.get('/r3/calendar-feed/mine');
export const revokeCalendarFeedSubscription = (id) => client.post(`/r3/calendar-feed/${id}/revoke`);
