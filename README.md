# Daily Hatchery

ระบบจัดการงานประจำวันของโรงเพาะ: ส่งลิงก์ให้คนงานกรอกข้อมูล, ตรวจ worker key, บันทึก Food / Grow-out / Nursery / Water Prep, แจ้ง Telegram, export รายงาน, รับค่า sensor และสั่ง actuator

## Stack

- Next.js App Router
- Prisma + Neon Postgres
- NextAuth Google login
- Telegram Bot API
- Vercel Cron
- Security headers via `next.config.ts`

## Local Development

```powershell
pnpm install
pnpm prisma generate
pnpm db:push
pnpm db:seed
pnpm dev
```

เปิดระบบที่:

```text
http://localhost:3000
```

หน้า admin:

```text
http://localhost:3000/admin
```

## Environment

คัดลอกจาก `.env.example` เป็น `.env` แล้วใส่ค่าจริง:

- `DATABASE_URL`
- `DIRECT_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_DAILY_URL_CHAT_ID`
- `TELEGRAM_ENTRY_ACTIVITY_CHAT_ID`
- `TELEGRAM_DAILY_SUMMARY_CHAT_ID`
- `APP_BASE_URL`
- `DEFAULT_TIMEZONE`
- `INITIAL_OWNER_EMAIL`
- `CRON_SECRET`
- `SENSOR_INGEST_SECRET`
- `ACTUATOR_DEVICE_SECRET`

ห้าม commit `.env` เพราะมี production secrets

## Verification

```powershell
pnpm typecheck
pnpm lint
pnpm build
pnpm env:check
pnpm smoke:app
```

`pnpm env:check` เช็ก `.env` แบบไม่แตะ database และไม่โชว์ secret เต็ม

`pnpm smoke:app` ใช้เช็ก `/`, `/showcase` และ `/api/health` โดยไม่สร้างข้อมูลใหม่และไม่ส่ง Telegram

## Device Demo Scripts

หลังรัน `pnpm dev` แล้วใช้ script เหล่านี้ทดสอบ API ฝั่งอุปกรณ์ได้:

```powershell
pnpm device:sensor-demo
pnpm device:actuator-demo
```

`device:sensor-demo` จะส่งค่า sensor ตัวอย่างเข้า `/api/system/sensors/readings`

`device:actuator-demo` จะดึง pending actuator commands จาก `/api/system/actuators/commands` แล้ว mark เป็น `EXECUTING` และ `SUCCESS`

## Main Flows

- Owner login: `/admin/login`
- Owner approval: `/admin/accounts`
- Worker people/keys: `/admin/people`, `/admin/keys`
- Daily worker link: `/admin`
- Worker entry: `/entry/[dailyToken]`
- Worker verification: access logging + per-IP failed attempt guard
- Admin reports/export: `/admin/reports`, `/admin/export`
- Sensors/actuators/automation: `/admin/sensors`, `/admin/actuators`, `/admin/automation`
- System readiness: `/admin/system`
- Public demo: `/showcase`
- Health check: `/api/health`

## Deployment

ดูขั้นตอน production ที่ `doc/deployment-runbook.md`
