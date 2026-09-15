import client from './client';

export const signOut = () => client.post('/auth/signout');
export const getAuthConfig = () => client.get('/auth/config');
