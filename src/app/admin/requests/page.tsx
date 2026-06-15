import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { readCollection } from "@/lib/db";
import type { CustomRequest } from "@/lib/types";
import { RequestsClient } from "./RequestsClient";

export const metadata = { title: "Requests" };

export default async function AdminRequestsPage() {
  if (!(await requireAdmin())) redirect("/admin/login");

  const requests = await readCollection<CustomRequest[]>("custom-requests", []);
  const sorted = [...requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div>
      <h1 className="text-xl font-semibold text-ivory">Customization requests</h1>
      <p className="mt-1 text-sm text-muted">
        {sorted.length} request{sorted.length === 1 ? "" : "s"} from the customization page.
        Uploaded logos are saved under <code className="rounded bg-ink-3 px-1.5 py-0.5 font-mono text-[11px]">data/uploads/</code>.
      </p>
      <RequestsClient initialRequests={sorted} />
    </div>
  );
}
