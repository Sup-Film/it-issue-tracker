"use client";
import { useForm } from "react-hook-form";
import { useCreateIssue } from "@/hooks/useIssues";
import { zodResolver } from "@hookform/resolvers/zod";
import { createIssueSchema } from "@/lib/validators/issue";


type FormData = {
  title: string;
  description: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
};

export default function CreateIssueForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(createIssueSchema),
  });
  const { mutate: createIssue, isPending } = useCreateIssue();

  const onSubmit = (data: FormData) => {
    createIssue(data, { onSuccess: () => reset() });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="p-4 mb-6 bg-white shadow rounded-lg space-y-3">
      <h2 className="text-xl font-semibold">Create New Issue</h2>
      <input
        {...register("title")}
        placeholder="Title"
        className="w-full p-2 border rounded"
      />
      {errors.title && <p className="text-red-500">{errors.title.message}</p>}
      <textarea
        {...register("description")}
        placeholder="Description"
        className="w-full p-2 border rounded"
      />
      {errors.description && (
        <p className="text-red-500">{errors.description.message}</p>
      )}
      <input
        {...register("category")}
        placeholder="Category (e.g., Hardware)"
        className="w-full p-2 border rounded"
      />
      {errors.category && <p className="text-red-500">{errors.category.message}</p>}
      <select
        {...register("priority")}
        defaultValue="MEDIUM"
        className="w-full p-2 border rounded">
        <option value="LOW">Low</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">High</option>
      </select>
      {errors.priority && <p className="text-red-500">{errors.priority.message}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400">
        {isPending ? "Submitting..." : "Submit Issue"}
      </button>
    </form>
  );
}
