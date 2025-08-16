import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export type SupportUser = { id: string; name: string; email: string };

export const useSupportUsers = () => {
  return useQuery<SupportUser[], Error>({
    queryKey: ['supportUsers'],
    queryFn: async () => {
      const { data } = await api.get('/users/support');
      return data as SupportUser[];
    },
  });
};
