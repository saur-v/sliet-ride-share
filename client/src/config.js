// client/src/config.js
// All Vite env vars in one place. Import this instead of import.meta.env directly.

export const config = {
  apiUrl:          import.meta.env.VITE_API_URL      || '',
  socketUrl:       import.meta.env.VITE_SOCKET_URL   || '',
  collegeDomain:   import.meta.env.VITE_COLLEGE_DOMAIN || 'sliet.ac.in',
  expirySoonHours: parseInt(import.meta.env.VITE_EXPIRY_SOON_HOURS || '2', 10),
};
