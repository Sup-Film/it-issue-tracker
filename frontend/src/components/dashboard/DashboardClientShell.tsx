"use client";
import React, { useState } from "react";
import CreateIssueForm from "./CreateIssueForm";
import IssueList from "./IssueList";
import { useAuthStore } from "@/stores/auth.store";
import type { Issue } from "@/hooks/useIssues";

export default function DashboardClientShell({ initialIssues, initialRole }: { initialIssues: Issue[]; initialRole?: string }) {
  const user = useAuthStore((s) => s.user);

  // Filter state (client-side filtering)
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState<string>("ALL");
  const [status, setStatus] = useState<string>("ALL");

  return (
    <div>
      {user?.role !== "ADMIN" && <CreateIssueForm />}

      <div className="flex items-center justify-between mt-4 mb-2">
        <h2 className="text-2xl font-semibold">
          {user?.role === "ADMIN" ? "All Issues" : "Your Issues"}
        </h2>

        <div className="flex gap-2 items-center">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title or description"
            className="p-2 border rounded"
          />

          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="p-2 border rounded">
            <option value="ALL">All priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>

          <select value={status} onChange={(e) => setStatus(e.target.value)} className="p-2 border rounded">
            <option value="ALL">All status</option>
            <option value="NEW">New</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      <IssueList
        initialIssues={initialIssues}
        initialRole={initialRole}
        search={search}
        priorityFilter={priority}
        statusFilter={status}
      />
    </div>
  );
}
