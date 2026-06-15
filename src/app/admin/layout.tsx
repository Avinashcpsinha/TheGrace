import type { Metadata } from "next";
import { AdminShell } from "./_components/AdminShell";

/**
 * Admin area layout — sidebar shell around all /admin pages.
 *
 * Deliberately does NOT auth-gate: /admin/login renders inside this layout
 * before a session exists. Each admin page calls requireAdmin() itself and
 * every /api/admin route verifies the cookie. The shell checks the pathname
 * client-side and renders the login page without the sidebar chrome.
 */
export const metadata: Metadata = {
  title: { default: "Admin — The Grace", template: "%s · Admin — The Grace" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
