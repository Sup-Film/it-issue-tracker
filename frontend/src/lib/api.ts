import axios from 'axios';

// Detect server vs client. In Next.js, `typeof window === 'undefined'` when code runs on server.
const isServer = typeof window === 'undefined';

const baseURL = isServer
  ? process.env.INTERNAL_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://backend:8080/api'
  : process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL,
  withCredentials: true, // สำคัญมาก: เพื่อให้ browser ส่ง cookie ไปกับ request
});

export default api;