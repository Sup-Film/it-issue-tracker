"use client";
import React from "react";
import LogoutButton from "./LogoutButton";
import { useAuthStore } from "@/stores/auth.store";
import Link from "next/link";

export default function ClientHeader() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="flex items-center">
      {user ? (
        <>
          <span className="mr-2 text-sm">{user.email}</span>
          <LogoutButton />
        </>
      ) : (
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm">
            Login
          </Link>
          <Link href="/register" className="text-sm">
            Register
          </Link>
        </div>
      )}
    </div>
  );
}
