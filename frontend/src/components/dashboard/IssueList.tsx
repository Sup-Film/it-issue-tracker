"use client";
import React, { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetIssues,
  Issue,
  useAssignIssue,
  useUpdateIssueStatus,
} from "@/hooks/useIssues";
import { useSupportUsers, SupportUser } from "@/hooks/useSupportUsers";
import { socket } from "@/lib/socket";
import { useAuthStore } from "@/stores/auth.store";

export default function IssueList({
  initialIssues,
  initialRole,
  search,
  priorityFilter,
  statusFilter,
}: {
  initialIssues: Issue[];
  initialRole?: string;
  search?: string;
  priorityFilter?: string;
  statusFilter?: string;
}) {
  const user = useAuthStore((state) => state.user);
  const role = user?.role ?? initialRole;
  const { data: issues, isLoading, error } = useGetIssues(role, initialIssues);
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!user) return;
    const roleKey = ["issues", user.role] as const;
    const handleStatusChange = (updated: Issue) => {
      queryClient.setQueryData(roleKey, (old: Issue[] | undefined) =>
        (old ?? []).map((i) => (i.id === updated.id ? updated : i))
      );
    };

    socket.connect();
    socket.on("issue:status_changed", handleStatusChange);
    return () => {
      socket.off("issue:status_changed", handleStatusChange);
      socket.disconnect();
    };
  }, [user, queryClient]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading issues.</div>;

  // Apply client-side filters on the combined data (react-query data takes precedence)
  const source = issues ?? initialIssues ?? [];
  const filtered = source.filter((issue) => {
    if (
      priorityFilter &&
      priorityFilter !== "ALL" &&
      issue.priority !== priorityFilter
    )
      return false;
    if (statusFilter && statusFilter !== "ALL" && issue.status !== statusFilter)
      return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !issue.title.toLowerCase().includes(q) &&
        !issue.description.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  if (filtered.length === 0) return <p>No issues found.</p>;

  return (
    <div className="space-y-4 max-w-2xl mx-auto w-full px-2 sm:px-0">
      {filtered.map((issue) => (
        <IssueCard key={issue.id} issue={issue} />
      ))}
    </div>
  );
}

function IssueCard({ issue }: { issue: Issue }) {
  const statusColor = {
    NEW: "bg-blue-200 text-blue-800",
    IN_PROGRESS: "bg-yellow-200 text-yellow-800",
    RESOLVED: "bg-green-200 text-green-800",
  };
  // Defensive: ensure we never index with undefined and provide a sensible fallback
  const statusClass =
    statusColor[(issue.status ?? "NEW") as keyof typeof statusColor] ??
    "bg-gray-200 text-gray-700";
  const user = useAuthStore((s) => s.user);
  const assignMutation = useAssignIssue();
  const statusMutation = useUpdateIssueStatus();

  // local state for assign input
  const [assigneeId, setAssigneeId] = React.useState("");
  const [isAssigning, setIsAssigning] = React.useState(false);
  const {
    data: supportUsers,
    isLoading: supportLoading,
    error: supportError,
  } = useSupportUsers();

  // ถ้ามี assigneeId แล้ว (issue.assigneeId) ไม่ต้องโชว์ assign UI
  const alreadyAssigned = Boolean((issue as any).assigneeId);

  return (
    <div className="p-4 bg-white shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition flex flex-col gap-2 sm:gap-3 w-full">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <h3 className="font-bold text-lg text-gray-800 break-words">
          {issue.title}
        </h3>
        <span
          suppressHydrationWarning
          className={`px-2 py-1 text-xs font-semibold rounded-full ${statusClass} min-w-[90px] text-center`}>
          {" "}
          {(issue.status ?? "UNKNOWN").replaceAll("_", " ")}{" "}
        </span>
      </div>
      <p className="text-gray-600 mt-1 whitespace-pre-line break-words">
        {issue.description}
      </p>
      <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-2">
        <span className="bg-gray-100 px-2 py-1 rounded">
          Priority: {issue.priority}
        </span>
        <span className="bg-gray-100 px-2 py-1 rounded">
          Category: {issue.category}
        </span>
      </div>
      {/* Admin: assign to support (simple input) */}
      {user?.role === "ADMIN" && !alreadyAssigned && (
        <div className="mt-3 flex flex-col sm:flex-row gap-2 items-center w-full">
          {supportLoading ? (
            <div>Loading supports...</div>
          ) : supportError ? (
            <div className="text-red-600">Failed to load support users</div>
          ) : (
            <>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition w-full sm:w-auto">
                <option value="">Select support</option>
                {(supportUsers ?? []).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  setIsAssigning(true);
                  assignMutation.mutate(
                    { id: issue.id, assigneeId },
                    {
                      onSuccess: () => {
                        setIsAssigning(false);
                        setAssigneeId("");
                        alert("Assigned successfully");
                      },
                      onError: (err: any) => {
                        setIsAssigning(false);
                        alert(
                          "Assign failed: " +
                            (err?.response?.data?.message ||
                              err?.message ||
                              "Unknown error")
                        );
                      },
                    }
                  );
                }}
                className="px-3 py-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded transition disabled:bg-gray-300 w-full sm:w-auto"
                disabled={!assigneeId || isAssigning}>
                {isAssigning ? "Assigning..." : "Assign"}
              </button>
            </>
          )}
        </div>
      )}

      {/* Support: update status */}
      {user?.role === "SUPPORT" && (
        <div className="mt-3 w-full">
          <select
            defaultValue={issue.status}
            onChange={(e) =>
              statusMutation.mutate({ id: issue.id, status: e.target.value })
            }
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition w-full sm:w-auto">
            <option value="NEW">New</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      )}
    </div>
  );
}
