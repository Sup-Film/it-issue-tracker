"use client";
import React from "react";
import LogoutButton from "./LogoutButton";
import { useAuthStore } from "@/stores/auth.store";
import Link from "next/link";

export default function ClientHeader() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="flex items-center gap-2">
      {user ? (
        <>
          <span className="mr-2 text-sm hidden sm:inline">{user.email}</span>
          <LogoutButton />
          <Link
            href="/dashboard"
            className="ml-2 px-3 py-1 border rounded text-sm">
            Dashboard
          </Link>
        </>
      ) : (
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm px-2 py-1">
            Login
          </Link>
          <Link href="/register" className="text-sm px-2 py-1">
            Register
          </Link>
        </div>
      )}
    </div>
  );
}
