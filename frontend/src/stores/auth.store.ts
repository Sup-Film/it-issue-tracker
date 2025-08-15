import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../lib/api";

// โครงข้อมูลผู้ใช้ที่เก็บใน store (ไม่เก็บ token)
interface User {
  userId: string;
  email: string;
  role: string;
}

// รูปแบบ state ของ authentication ใน client
// - user: ข้อมูลโปรไฟล์ หรือ null ถ้ายังไม่ได้ล็อกอิน
// - isAuthenticated: boolean สำหรับเช็กสถานะการล็อกอินแบบง่าย
// - setUser: ฟังก์ชันใช้ตั้งค่า user และสถานะการล็อกอิน
interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: () => boolean;
  logout: () => Promise<void>;
}

// สร้าง zustand store และทำ persist (เก็บลง localStorage ภายใต้คีย์ 'auth-storage')
// หมายเหตุ: นี่เก็บเฉพาะโปรไฟล์ (non-sensitive) เท่านั้น — token เก็บโดย backend เป็น httpOnly cookie
export const useAuthStore = create<AuthState>()(
  // persist middleware จะช่วยเก็บ state ลง Local Storage
  persist(
    (set, get) => ({
      user: null,
      setUser: (user) => set({ user }),
      isAuthenticated: () => !!get().user, // ฟังก์ชันสำหรับเช็คว่า login หรือยัง
      logout: async () => {
        try {
          await api.post("/auth/logout");
        } catch (err) {
          console.warn("logout failed", err);
        }

        // clear client state
        set({ user: null });
      },
    }),
    {
      name: "auth-storage", // ชื่อ key ใน Local Storage
    }
  )
);
