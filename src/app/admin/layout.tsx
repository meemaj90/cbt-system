import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if ((session.user as any).role !== "ADMIN") redirect("/login");

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={session.user as any} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar role="admin" />
        <main className="flex-1 overflow-y-auto bg-slate-50">{children}</main>
      </div>
    </div>
  );
}
