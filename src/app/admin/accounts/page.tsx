import Link from "next/link";
import { updateAdminAccountApprovalAction } from "@/app/admin/actions";
import { getPrisma } from "@/lib/db/prisma";
import { requireOwner } from "@/lib/permissions/require-admin";
import { formatBangkokDateTime } from "@/lib/time/bangkok";

export default async function AdminAccountsPage() {
  const accessState = await requireOwner();
  const adminAccounts = await getPrisma().adminAccount.findMany({
    include: {
      person: true,
      approvedByAdminAccount: { include: { person: true } },
    },
    orderBy: [
      { approvalStatus: "asc" },
      { createdAt: "desc" },
    ],
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <Link className="text-sm font-medium text-accent" href="/admin">
        กลับศูนย์จัดการ
      </Link>
      <p className="mt-6 text-sm font-medium text-accent">Admin / Accounts</p>
      <h1 className="mt-2 text-3xl font-semibold">อนุมัติบัญชีหัวหน้าฟาร์ม</h1>
      <p className="mt-3 max-w-2xl text-muted">
        บัญชี Google ใหม่ที่เข้าระบบจะอยู่ในสถานะ pending จนกว่า owner จะอนุมัติ
      </p>

      <div className="mt-8 divide-y divide-border rounded-lg border border-border bg-card">
        {adminAccounts.map((account) => {
          const isCurrentOwner = account.id === accessState.adminAccount.id;

          return (
            <section key={account.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_auto]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold">{account.person.displayName}</h2>
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClassName(account.approvalStatus)}`}>
                    {account.approvalStatus}
                  </span>
                  <span className="rounded-full bg-background px-2 py-1 text-xs font-medium text-muted">
                    {account.adminRole}
                  </span>
                  {isCurrentOwner ? (
                    <span className="rounded-full bg-background px-2 py-1 text-xs font-medium text-muted">
                      บัญชีของคุณ
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm text-muted">{account.googleEmail}</p>
                <dl className="mt-4 grid gap-2 text-sm text-muted sm:grid-cols-2">
                  <div>
                    <dt className="font-medium text-foreground">สมัครเมื่อ</dt>
                    <dd>{formatBangkokDateTime(account.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-foreground">อนุมัติโดย</dt>
                    <dd>
                      {account.approvedByAdminAccount
                        ? `${account.approvedByAdminAccount.person.displayName} · ${formatBangkokDateTime(account.approvedAt ?? account.updatedAt)}`
                        : "-"}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="flex flex-wrap items-start gap-2 lg:justify-end">
                <form action={updateAdminAccountApprovalAction} className="flex flex-wrap gap-2">
                  <input name="adminAccountId" type="hidden" value={account.id} />
                  <input name="intent" type="hidden" value="approve" />
                  <select
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    defaultValue={account.adminRole}
                    name="adminRole"
                  >
                    <option value="HEAD">HEAD</option>
                    <option value="OWNER">OWNER</option>
                  </select>
                  <button
                    className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
                    type="submit"
                  >
                    อนุมัติ
                  </button>
                </form>

                <form action={updateAdminAccountApprovalAction}>
                  <input name="adminAccountId" type="hidden" value={account.id} />
                  <input name="intent" type="hidden" value="reject" />
                  <button
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={isCurrentOwner}
                    type="submit"
                  >
                    ปฏิเสธ
                  </button>
                </form>

                <form action={updateAdminAccountApprovalAction}>
                  <input name="adminAccountId" type="hidden" value={account.id} />
                  <input name="intent" type="hidden" value="disable" />
                  <button
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={isCurrentOwner}
                    type="submit"
                  >
                    ปิดใช้งาน
                  </button>
                </form>
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}

function statusClassName(status: string) {
  if (status === "APPROVED") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "PENDING") {
    return "bg-amber-100 text-amber-700";
  }

  if (status === "REJECTED") {
    return "bg-red-100 text-red-700";
  }

  return "bg-slate-100 text-slate-700";
}
