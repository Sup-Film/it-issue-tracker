import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

// TypeScript type ที่อธิบายรูปแบบของ Issue ตามที่ backend คืนมา
export interface Issue {
  id: string;
  title: string;
  description: string;
  status: "NEW" | "IN_PROGRESS" | "RESOLVED";
  priority: "LOW" | "MEDIUM" | "HIGH";
  category: string;
  createdAt: string; // ISO timestamp string
  updatedAt: string; // ISO timestamp string
  // optional relations — include minimal fields needed for UI
  assignee?: { name: string; email: string };
  author?: { name: string; email: string };
}


// Hook สำหรับดึงข้อมูล Issues ตามบทบาท (role) ของผู้ใช้
// - role: ค่า 'ADMIN' | 'SUPPORT' | 'USER' จะกำหนด endpoint ที่จะเรียก
// - initialData: ข้อมูลเริ่มต้นสำหรับ cache (optional) ช่วยลดการกระพริบเมื่อหน้าโหลดครั้งแรก
export const useGetIssues = (role: string | undefined, initialData: Issue[]) => {
  // Map role => backend endpoint (adjust paths to match backend routes)
  const endpointMap: { [key: string]: string } = {
    ADMIN: '/issues/admin',
    SUPPORT: '/issues/support',
    USER: '/issues/user',
  };

  // หากไม่มี role ให้ใช้ endpoint สำหรับผู้ใช้ทั่วไปเป็น fallback
  const endpoint = role ? endpointMap[role] : '/issues/user';

  // useQuery จะจัดการ cache, loading และ error ให้เรา
  // queryKey ควรระบุเงื่อนไขของ query ให้ชัดเจน (ที่นี่รวม role เพื่อแยก cache)
  return useQuery<Issue[]>({
    queryKey: ['issues', role], // cache separation by role
    queryFn: async () => {
      const { data } = await api.get(endpoint);
      return data;
    },
    // initialData lets you hydrate or avoid a loading spinner on first render
    // initialData ช่วยให้เราสามารถให้ค่าเริ่มต้นของ cache เพื่อลดการแสดง spinner
    initialData: initialData,
  });
};

// Hook สำหรับสร้าง Issue ใหม่ (mutation)
// - ใช้ useMutation เมื่อเราต้องการเรียก API แบบเปลี่ยนแปลงข้อมูล (POST/PUT/PATCH/DELETE)
// - onSuccess: เราทำการ invalidate cache ที่เกี่ยวข้องเพื่อให้รายการ issues ถูก refresh
export const useCreateIssue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    // mutationFn: ฟังก์ชันที่เรียก API เพื่อสร้าง issue ใหม่
    mutationFn: (newIssue: Omit<Issue, 'id' | 'createdAt' | 'updatedAt' | 'status'>) =>
      api.post('/issues', newIssue),

    // เมื่อสร้างสำเร็จ: Invalidate queries ที่เกี่ยวข้อง เพื่อให้ UI อัปเดต
    onSuccess: () => {
      // กำหนดให้ cache ที่เกี่ยวข้องกับ issues ทั้งหมดถูกรีเฟรช
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },

    // เมื่อเกิดข้อผิดพลาด: แจ้งผู้ใช้ (ที่นี่ใช้ alert เป็นตัวอย่าง)
    onError: (error: any) => {
  alert('ไม่สามารถสร้าง issue ได้: ' + (error.response?.data?.message || 'โปรดลองอีกครั้ง'));
    },
  });
};

// Hook สำหรับ assign issue (Admin -> assign to support)
// payload: { id, assigneeId }
export const useAssignIssue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, assigneeId }: { id: string; assigneeId: string }) =>
      api.put(`/issues/${id}/assign`, { assigneeId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
    onError: (err: any) => {
      alert('ไม่สามารถมอบหมายงานได้: ' + (err.response?.data?.message || 'โปรดลองอีกครั้ง'));
    },
  });
};

// Hook สำหรับอัพเดทสถานะของ issue (Support หรือ Admin)
export const useUpdateIssueStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/issues/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
    onError: (err: any) => {
      alert('ไม่สามารถอัพเดทสถานะได้: ' + (err.response?.data?.message || 'โปรดลองอีกครั้ง'));
    },
  });
};
