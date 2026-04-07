import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { authOptions } from "@/auth";
import { getAdminAccessState } from "@/lib/permissions/admin";

export default async function AdminPendingPage() {
  const session = await getServerSession(authOptions);
  const accessState = await getAdminAccessState({
    email: session?.user?.email,
    displayName: session?.user?.name,
  });

  if (accessState.status === "UNAUTHENTICATED") {
    redirect("/admin/login");
  }

  if (accessState.status === "APPROVED") {
    redirect("/admin");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6 py-10">
      <p className="text-sm font-medium text-accent">Pending</p>
      <h1 className="mt-2 text-3xl font-semibold">ยังเข้า admin ไม่ได้</h1>
      <p className="mt-3 text-muted">
        บัญชี {accessState.adminAccount.googleEmail} อยู่ในสถานะ{" "}
        {accessState.status} ต้องให้ owner อนุมัติก่อนจึงจะเข้าใช้งานได้
      </p>
      <Link className="mt-6 inline-flex text-sm font-medium text-accent" href="/api/auth/signout">
        ออกจากระบบ
      </Link>
    </main>
  );
}
