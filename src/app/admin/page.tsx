import Link from "next/link";
import { generateDailyLinkAction } from "@/app/admin/actions";
import { getPrisma } from "@/lib/db/prisma";
import { requireApprovedAdmin } from "@/lib/permissions/require-admin";
import { formatBangkokDateTime } from "@/lib/time/bangkok";

export default async function AdminHomePage() {
  const accessState = await requireApprovedAdmin();
  const activeDailyLink = await getPrisma().dailyLink.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });

  const cards = [
    { href: "/admin/dashboard", title: "Dashboard", description: "ภาพรวมข้อมูลวันนี้" },
    { href: "/admin/reports", title: "Reports", description: "รายงานตามช่วงวันที่" },
    { href: "/admin/export", title: "Export", description: "ดาวน์โหลด CSV จากข้อมูลรายงาน" },
    { href: "/admin/activity", title: "Activity", description: "ดู log ล่าสุดของระบบทั้งหมด" },
    { href: "/admin/accounts", title: "Accounts", description: "อนุมัติและปิดใช้งานบัญชีหัวหน้าฟาร์ม" },
    { href: "/admin/sensors", title: "Sensors", description: "ดูค่าล่าสุดและจัดการ sensor" },
    { href: "/admin/actuators", title: "Actuators", description: "สั่ง ON/OFF และดู command log" },
    { href: "/admin/automation", title: "Automation", description: "ตั้งกฎ sensor threshold สำหรับ actuator" },
    { href: "/admin/system", title: "System", description: "ตรวจ env และ deployment readiness" },
    { href: "/admin/people", title: "People", description: "เพิ่มและจัดการคนในฟาร์ม" },
    { href: "/admin/keys", title: "Worker Keys", description: "สร้างคีย์ให้คนงานใช้กรอกข้อมูล" },
    { href: "/admin/dropdowns", title: "Dropdowns", description: "จัดการตัวเลือกในฟอร์ม" },
    { href: "/admin/calculations", title: "Calculations", description: "ตั้งค่าการคำนวณอาหารและ Nursery" },
    { href: "/admin/tasks", title: "Tasks", description: "จัดการงานล่วงหน้าที่คนงานเห็นได้" },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <p className="text-sm font-medium text-accent">Admin</p>
      <h1 className="mt-2 text-3xl font-semibold">ศูนย์จัดการฟาร์ม</h1>
      <p className="mt-3 max-w-2xl text-muted">
        ลงชื่อเข้าใช้แล้วในฐานะ {accessState.adminAccount.person.displayName} ({accessState.role})
      </p>

      <section className="mt-8 rounded-lg border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">ลิงก์กรอกข้อมูลวันนี้</h2>
        {activeDailyLink ? (
          <div className="mt-3 space-y-2 text-sm text-muted">
            <p>
              ลิงก์ปัจจุบัน:{" "}
              <Link className="font-mono text-accent" href={`/entry/${activeDailyLink.token}`}>
                /entry/{activeDailyLink.token}
              </Link>
            </p>
            <p>หมดอายุ: {formatBangkokDateTime(activeDailyLink.expiresAt)}</p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">ยังไม่มีลิงก์ที่ active</p>
        )}
        <form action={generateDailyLinkAction} className="mt-4">
          <button
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
            type="submit"
          >
            สร้างและส่ง Telegram
          </button>
        </form>
      </section>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((item) => (
          <Link key={item.href} href={item.href} className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-lg font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm text-muted">{item.description}</p>
          </Link>
        ))}
      </div>
      <Link className="mt-8 inline-flex text-sm font-medium text-accent" href="/api/auth/signout">
        ออกจากระบบ
      </Link>
    </main>
  );
}
