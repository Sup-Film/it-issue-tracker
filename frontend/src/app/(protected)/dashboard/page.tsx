import { cookies } from "next/headers";
import api from "@/lib/api";
import { Issue } from "@/hooks/useIssues";
import IssueList from "@/components/dashboard/IssueList";
import DashboardClientShell from "@/components/dashboard/DashboardClientShell";

// Function to fetch initial data on the server
async function getInitialIssues(role: string): Promise<Issue[]> {
  try {
    const cookieJar = await cookies();
    const cookie = cookieJar.get("accessToken")?.value;
    if (!cookie) return [];

    const endpointMap: { [key: string]: string } = {
      ADMIN: "/issues/admin",
      SUPPORT: "/issues/support",
      USER: "/issues/user",
    };
    const endpoint = endpointMap[role] || "/issues/user";

    const { data } = await api.get(endpoint, {
      headers: { Cookie: `accessToken=${cookie}` },
    });
    return data;
  } catch (error) {
    console.error("Failed to fetch initial issues on server:", error);
    return [];
  }
}

export default async function DashboardPage() {
  // Determine user/role on the server from the cookie and backend /api/me
  // (Don't rely on client-side Zustand when rendering on the server)
  let initialIssues: Issue[] = [];
  let initialRole: string | undefined = undefined;
  try {
    const cookieJar = await cookies();
    const token = cookieJar.get("accessToken")?.value;
    if (token) {
      // call server-side endpoint to get user info (uses cookie for auth)
      const me = await api
        .get("/me", { headers: { Cookie: `accessToken=${token}` } })
        .then((r) => r.data)
        .catch(() => null);
      if (me?.role) {
        initialRole = me.role;
        initialIssues = await getInitialIssues(me.role);
      }
    }
  } catch (e) {
    console.error("Error fetching initial user/issues on server:", e);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <DashboardClientShell
        initialIssues={initialIssues}
        initialRole={initialRole}
      />
    </div>
  );
}
