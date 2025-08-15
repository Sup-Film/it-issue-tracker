"use client";
import React from "react";
import { useUser } from "@/hooks/useAuth";

// ClientAuthLoader: client component ที่ทำหน้าที่โหลด session ปัจจุบันเมื่อแอปถูก hydrate/โหลด
// - ทำหน้าที่เดียว: เรียก useUser() เพื่อให้ React Query fetch /me และ sync ผลกับ zustand
// - วางไว้ที่ root layout เพื่อให้ทุกหน้าในแอปมีการตรวจสอบ session อัตโนมัติ
export default function ClientAuthLoader({ children }: { children: React.ReactNode }) {
  // เรียก useUser() ตรงนี้จะ trigger request /me หากมี cookie (httpOnly) อยู่
  // เมื่อได้ข้อมูล useUser() จะเรียก setUser(data) ภายใน hook (sync กับ zustand)
  useUser();
  return <>{children}</>;
}
