import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/auth";
import { GoogleSignInButton } from "@/app/admin/login/google-sign-in-button";
import { getAdminAccessState } from "@/lib/permissions/admin";

export default async function AdminLoginPage() {
  const session = await getServerSession(authOptions);

  if (session?.user?.email) {
    const accessState = await getAdminAccessState({
      email: session.user.email,
      displayName: session.user.name,
    });

    if (accessState.status === "APPROVED") {
      redirect("/admin");
    }

    redirect("/admin/pending");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6 py-10">
      <p className="text-sm font-medium text-accent">Admin Login</p>
      <h1 className="mt-2 text-3xl font-semibold">เข้าสู่ระบบผู้ดูแล</h1>
      <p className="mt-3 text-muted">
        ใช้ Google account เพื่อเข้าหน้าผู้ดูแล ระบบจะตรวจสถานะ owner approval
        ก่อนเปิดสิทธิ์ admin
      </p>
      <GoogleSignInButton />
    </main>
  );
}
