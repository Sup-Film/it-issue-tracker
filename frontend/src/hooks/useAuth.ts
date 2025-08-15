import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

// Hook สำหรับดึงข้อมูลผู้ใช้ปัจจุบัน (ถ้ามี cookie อยู่)
export const useUser = () => {
  const setUser = useAuthStore((state) => state.setUser);
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get('/me');
      setUser(data);
      return data;
    },
    retry: false, // ไม่ต้องพยายามใหม่ถ้าล้มเหลว (แปลว่าไม่ได้ login)
    refetchOnWindowFocus: false,
  });
};