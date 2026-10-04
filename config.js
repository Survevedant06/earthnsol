// =============================================
//   EarthNsol — Config File
//   ✅ ONLY change this file when going live!
// =============================================
const CONFIG = {
  // Automatically detect the current website URL
  SITE_URL: typeof window !== 'undefined' ? window.location.origin : 'https://earthnsol.in',

  SENDER_NAME:  'EarthNsol',
  SENDER_EMAIL: 'earthnsol@gmail.com',

  // Automatically detect the backend URL (local port 5000 in dev, same origin in production)
  BACKEND_URL: typeof window !== 'undefined' 
    ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:5000' 
        : window.location.origin)
    : 'https://earthnsol.in',
};
