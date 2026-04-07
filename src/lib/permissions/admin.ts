import { getPrisma } from "@/lib/db/prisma";

type AdminAccessInput = {
  email: string | null | undefined;
  displayName?: string | null;
};

export async function getAdminAccessState(input: AdminAccessInput) {
  const { email, displayName } = input;

  if (!email) {
    return { status: "UNAUTHENTICATED" as const };
  }

  const prisma = getPrisma();
  const adminAccount = await prisma.adminAccount.findUnique({
    where: { googleEmail: email },
    include: { person: true },
  });

  if (!adminAccount) {
    const person = await prisma.person.create({
      data: {
        displayName: displayName ?? email,
        defaultRole: "HEAD",
      },
    });

    const pendingAdminAccount = await prisma.adminAccount.create({
      data: {
        personId: person.id,
        googleEmail: email,
        adminRole: "HEAD",
        approvalStatus: "PENDING",
      },
      include: { person: true },
    });

    return {
      status: "PENDING" as const,
      role: pendingAdminAccount.adminRole,
      adminAccount: pendingAdminAccount,
    };
  }

  return {
    status: adminAccount.approvalStatus,
    role: adminAccount.adminRole,
    adminAccount,
  } as const;
}
