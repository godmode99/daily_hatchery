type ExpiredPageProps = {
  params: Promise<{
    dailyToken: string;
  }>;
};

export default async function ExpiredPage({ params }: ExpiredPageProps) {
  const { dailyToken } = await params;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6 py-10">
      <p className="text-sm font-medium text-danger">Expired</p>
      <h1 className="mt-2 text-3xl font-semibold">ลิงก์นี้หมดอายุแล้ว</h1>
      <p className="mt-3 text-muted">
        ลิงก์ <span className="font-mono">{dailyToken}</span> ไม่สามารถใช้กรอกหรือแก้ไขข้อมูลได้แล้ว
        กรุณารอลิงก์รอบถัดไปหรือแจ้งหัวหน้า
      </p>
    </main>
  );
}
