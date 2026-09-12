import client from './client';

export const signOut = () => client.post('/auth/signout');
