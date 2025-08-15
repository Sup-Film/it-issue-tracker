"use client";
import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';

// - เรียก store.logout() เพื่อให้ backend ล้าง httpOnly cookie และ clear store
// - หลังจากนั้น invalidateQueries(['me']) เพื่อให้ React Query รีเฟรชข้อมูลผู้ใช้ (ถ้ามี useQuery(['me']) อยู่)
export default function LogoutButton() {
  const logout = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    await logout();
    try {
      // ทำการบอกว่าข้อมูลใน cache ของ Key ['me'] ถูกเก่าแล้ว ให้ทำการ refetch ใหม่
      await queryClient.invalidateQueries({ queryKey: ['me'] });
    } catch (e) {
      // ignore
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="ml-2 px-3 py-1 border rounded text-sm"
      aria-label="Logout"
    >
      Logout
    </button>
  );
}
