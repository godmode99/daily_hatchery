import Link from "next/link";

const entryPoints = [
  {
    href: "/admin",
    title: "ผู้ดูแล",
    description: "จัดการคน คีย์ รายงาน และข้อมูลจริงของฟาร์ม",
  },
  {
    href: "/showcase",
    title: "ตัวอย่างระบบ",
    description: "หน้าสาธิตสำหรับลูกค้า ใช้ข้อมูล DEMO เท่านั้น",
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-10">
      <p className="text-sm font-medium text-accent">Daily Hatchery</p>
      <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-normal text-foreground">
        ระบบบันทึกงานเพาะเลี้ยงประจำวัน
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
        โครงหลักเริ่มจาก worker operational flow ก่อน แล้วค่อยต่อ admin, reporting,
        automation และ showcase อย่างเป็นลำดับ
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {entryPoints.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-lg border border-border bg-card p-5 transition hover:border-accent"
          >
            <h2 className="text-lg font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{item.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
