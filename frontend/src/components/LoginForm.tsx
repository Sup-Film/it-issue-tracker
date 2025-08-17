"use client";

// Component: LoginForm (client)
// - ใช้ react-hook-form สำหรับจัดการ form state + validation (zod resolver)
// - ใช้ react-query useMutation สำหรับเรียก API POST /auth/login
// - อัปเดต zustand store (setUser) เมื่อ login สำเร็จ และ redirect
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginInput, loginSchema } from '@/lib/validators/auth';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginForm() {
  // store updater: เก็บข้อมูลผู้ใช้ใน client state
  const setUser = useAuthStore((s) => s.setUser);
  const router = useRouter();

  // mutation: handle login request
  // - mutationFn: ฟังก์ชันที่ส่ง request ไปยัง backend
  // - onSuccess: update store + redirect
  // - onError: แจ้ง error ให้ผู้ใช้
  const mutation = useMutation<any, any, LoginInput>({
    mutationFn: (data: LoginInput) => api.post('/auth/login', data),
    onSuccess: (response: any) => {
      console.log('Login successful', response);
      // backend ควรส่งข้อมูล user ใน response.data.user
      setUser(response.data.user);
      // redirect ไปหน้าแรก และสั่ง refresh เพื่อให้ Server Components โหลดข้อมูลใหม่
      router.push('/');
      router.refresh();
    },
    onError: (err: any) => {
      // เก็บ log และแจ้งผู้ใช้
      console.error('Login error', err);
      alert('Login failed: ' + (err.response?.data?.message || 'Please try again'));
    },
  });

  // flag ที่ใช้ปิดปุ่มระหว่างรัน
  const isPending = mutation.status === 'pending';

  // react-hook-form setup: register inputs + validation via zod
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  // onSubmit: เรียก mutation.mutate เพื่อส่งข้อมูลไปยัง backend
  const onSubmit = (data: LoginInput) => mutation.mutate(data);

  return (
    <>
      {/* Header */}
  <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>

      {/* Form */}
  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full">
  <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          {/* register('email') จะผูก input เข้ากับ react-hook-form */}
          <input {...register('email')} type="email" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
          {/* แสดง validation error ถ้ามี */}
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input {...register('password')} type="password" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>

        {/* Submit button: disabled ขณะ mutation กำลังรัน */}
  <button type="submit" disabled={isPending} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400">
          {isPending ? 'Logging in...' : 'Login'}
        </button>
      </form>

      {/* Link ไปหน้า register */}
      <p className="mt-4 text-center text-sm">
        Don&apos;t have an account? <Link href="/register" className="text-indigo-600 hover:underline">Register here</Link>
      </p>
    </>
  );
}
