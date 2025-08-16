import ClientHeader from "@/components/ClientHeader";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// This is a server component layout
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieJar = await cookies();
  const hasToken = cookieJar.has("accessToken");

  if (!hasToken) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="p-4 sm:p-8">{children}</main>
    </div>
  );
}
