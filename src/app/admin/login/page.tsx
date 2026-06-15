import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Login" };

export default async function AdminLoginPage() {
  // Already signed in? Straight to the dashboard.
  if (await requireAdmin()) redirect("/admin");
  return <LoginForm />;
}
