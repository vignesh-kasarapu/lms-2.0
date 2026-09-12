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
    const status = err.response?.status;

    // The session cookie can expire or be invalidated at any point (LMS-002/auth.middleware.js
    // returns 401 with NO_SESSION/SESSION_INVALID) — without this, every page just shows a
    // generic inline error forever with no way back to a signed-in state. Force a return to
    // /login instead, unless we're already there (avoids a redirect loop on the login page's
    // own failed sign-in attempts).
    if (status === 401 && window.location.pathname !== '/login') {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/login';
    }

    return Promise.reject({ code, message, status });
  },
);

export default client;
