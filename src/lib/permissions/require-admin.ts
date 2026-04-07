import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/auth";
import { getAdminAccessState } from "@/lib/permissions/admin";

export async function requireApprovedAdmin() {
  const session = await getServerSession(authOptions);
  const accessState = await getAdminAccessState({
    email: session?.user?.email,
    displayName: session?.user?.name,
  });

  if (accessState.status === "UNAUTHENTICATED") {
    redirect("/admin/login");
  }

  if (accessState.status !== "APPROVED") {
    redirect("/admin/pending");
  }

  return accessState;
}

export async function requireOwner() {
  const accessState = await requireApprovedAdmin();

  if (accessState.role !== "OWNER") {
    redirect("/admin");
  }

  return accessState;
}
