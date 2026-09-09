import axios from 'axios';

// Every backend call in this app goes through this single instance.
// Components never call axios/fetch directly — see the sibling files in this folder.
const client = axios.create({
  baseURL: '/api',
  withCredentials: true, // application session cookie (LMS-002)
});

client.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message = err.response?.data?.error?.message || 'Something went wrong. Please try again.';
    const code = err.response?.data?.error?.code || 'UNKNOWN';
    return Promise.reject({ code, message, status: err.response?.status });
  },
);

export default client;
