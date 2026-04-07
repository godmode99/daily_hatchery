# Deployment Runbook

เอกสารนี้ใช้สำหรับ deploy Daily Hatchery ขึ้น Vercel + Neon โดยไม่ต้องย้อนอ่านแชท

## 1. Vercel Project

- Repository: `daily_hatchery`
- Root Directory: `./`
- Framework Preset: `Next.js`
- Build Command: ใช้ default หรือ `pnpm build`
- Install Command: ใช้ default หรือ `pnpm install`
- Output Directory: เว้นว่าง/default

## 2. Neon

- Region: Singapore / Southeast Asia
- Neon Auth: ปิดไว้ เพราะระบบใช้ Google login ผ่าน NextAuth
- ใช้ pooled URL เป็น `DATABASE_URL`
- ใช้ unpooled URL เป็น `DIRECT_URL`

## 3. Vercel Environment Variables

ตั้งค่าต่อไปนี้ใน Vercel ทุก environment ที่ใช้งานจริง:

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
NEXTAUTH_URL="https://YOUR-VERCEL-DOMAIN"
NEXTAUTH_SECRET="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
TELEGRAM_BOT_TOKEN="..."
TELEGRAM_DAILY_URL_CHAT_ID="..."
TELEGRAM_ENTRY_ACTIVITY_CHAT_ID="..."
TELEGRAM_DAILY_SUMMARY_CHAT_ID="..."
APP_BASE_URL="https://YOUR-VERCEL-DOMAIN"
DEFAULT_TIMEZONE="Asia/Bangkok"
INITIAL_OWNER_EMAIL="bestpratice168@gmail.com"
CRON_SECRET="..."
SENSOR_INGEST_SECRET="..."
ACTUATOR_DEVICE_SECRET="..."
```

แนะนำให้ `SENSOR_INGEST_SECRET` และ `ACTUATOR_DEVICE_SECRET` เป็นคนละค่ากับ `CRON_SECRET` ใน production

## 4. Google OAuth

ใน Google Cloud Console > OAuth client:

Authorized JavaScript origins:

```text
http://localhost:3000
https://YOUR-VERCEL-DOMAIN
```

Authorized redirect URIs:

```text
http://localhost:3000/api/auth/callback/google
https://YOUR-VERCEL-DOMAIN/api/auth/callback/google
```

ถ้า OAuth consent screen ยังเป็น Testing ให้เพิ่ม owner email เป็น test user:

```text
bestpratice168@gmail.com
```

## 5. Vercel Cron

`vercel.json` มี cron 2 งาน:

- `09:00 Asia/Bangkok`: `/api/system/daily-link/generate`
- `18:00 Asia/Bangkok`: `/api/system/summary/send`

endpoint ตรวจ `Authorization: Bearer ${CRON_SECRET}` ตาม convention ของ Vercel Cron

ตอนนี้ยังไม่ใส่ automation evaluate เป็น cron เพิ่ม เพราะ Vercel Hobby จำกัดจำนวน cron jobs ถ้าต้องการ evaluate automation อัตโนมัติ ให้เลือกอย่างใดอย่างหนึ่ง:

- ใช้ external scheduler เรียก `/api/system/automation/evaluate`
- อัปเกรด plan
- รวมการ evaluate automation เข้า cron เดิมตามช่วงเวลาที่เหมาะสม

## 6. First Deploy Checklist

1. ตั้ง env vars บน Vercel ให้ครบ
2. เพิ่ม production callback URL ใน Google OAuth
3. Deploy
4. รัน `pnpm db:push` และ `pnpm db:seed` กับ database production ถ้ายังไม่ได้ sync schema/seed
5. Login ด้วย owner email
6. เข้า `/admin/system` เพื่อตรวจ readiness
7. เปิด `/api/health` เพื่อตรวจว่า app และ database ตอบได้
8. กดส่ง Daily Summary ตอนนี้ เพื่อทดสอบ Telegram summary
9. สร้าง worker key และ daily link เพื่อทดสอบ worker flow

ถ้าต้องการเช็กจากเครื่อง local หลัง deploy ให้ตั้ง `APP_BASE_URL` เป็น production domain แล้วรัน:

```powershell
pnpm smoke:app
```

script นี้เช็ก `/`, `/showcase` และ `/api/health` เท่านั้น จึงไม่สร้าง daily link และไม่ส่ง Telegram

ก่อน deploy สามารถเช็ก env local แบบ production policy ได้:

```powershell
pnpm env:check -- --production
```

## 7. Security Notes

ก่อนใช้ production จริง แนะนำ rotate secrets ที่เคยถูกส่งผ่านแชท:

- Telegram bot token
- Neon database password
- Google OAuth client secret
- `NEXTAUTH_SECRET`
- `CRON_SECRET`
- device secrets สำหรับ sensor/actuator

หลัง rotate แล้วต้องอัปเดตทั้ง local `.env` และ Vercel Environment Variables

## 8. Device API Smoke Test

หลัง deploy และตั้งค่า device secrets แล้ว สามารถทดสอบจากเครื่อง local โดยชี้ `.env` ไปที่ production domain:

```env
APP_BASE_URL="https://YOUR-VERCEL-DOMAIN"
SENSOR_INGEST_SECRET="..."
ACTUATOR_DEVICE_SECRET="..."
```

ส่ง sensor readings ตัวอย่าง:

```powershell
pnpm device:sensor-demo
```

ดึงและปิดงาน actuator commands ที่ pending:

```powershell
pnpm device:actuator-demo
```

ถ้าต้องการจำกัด actuator เฉพาะตัวใดตัวหนึ่ง ให้ตั้ง:

```env
ACTUATOR_DEMO_CODE="AIR_PUMP_1"
```
