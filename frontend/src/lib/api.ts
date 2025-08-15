import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api',
  withCredentials: true, // สำคัญมาก: เพื่อให้ browser ส่ง cookie ไปกับ request
});

export default api;