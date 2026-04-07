export const supportedLocales = ["th", "my", "en"] as const;

export type SupportedLocale = (typeof supportedLocales)[number];

export const defaultLocale: SupportedLocale = "th";

export const localeCookieName = "daily-hatchery-locale";

export const localeLabels: Record<SupportedLocale, string> = {
  th: "ไทย",
  my: "မြန်မာ",
  en: "English",
};

export const workerMessages = {
  th: {
    workerEntry: "Worker Entry",
    workerVerification: "Worker Verification",
    verifyWorkerKeyTitle: "ยืนยันคีย์พนักงาน",
    enterPersonalKey: "ใส่คีย์ส่วนตัว",
    linkValidUntil: "ลิงก์นี้ใช้ได้ถึง",
    goToVerify: "ไปหน้ายืนยันคีย์",
    invalidKeyOrExpired: "คีย์ไม่ถูกต้องหรือลิงก์หมดอายุแล้ว",
    workerKey: "คีย์พนักงาน",
    workerKeyPlaceholder: "กรอกคีย์",
    confirm: "ยืนยัน",
    today: "Today",
    todayWork: "งานวันนี้",
    greeting: "สวัสดี",
    linkCanBeUsedUntil: "ลิงก์นี้ใช้ได้ถึง",
    addEntry: "เพิ่มรายการ",
    visibleTasks: "งานที่หัวหน้าเปิดให้เห็น",
    starts: "เริ่ม",
    repeatsEvery: "ทำซ้ำทุก",
    days: "วัน",
    noVisibleTasks: "ยังไม่มีงานที่เปิดให้คนงานเห็น",
    noEntries: "ยังไม่มีรายการ",
    delete: "ลบ",
    edit: "แก้ไข",
    worker: "worker",
  },
  my: {
    workerEntry: "လုပ်သားဝင်ရောက်ရန်",
    workerVerification: "လုပ်သားအတည်ပြုခြင်း",
    verifyWorkerKeyTitle: "လုပ်သားကီး အတည်ပြုပါ",
    enterPersonalKey: "ကိုယ်ပိုင်ကီး ထည့်ပါ",
    linkValidUntil: "ဒီလင့်ခ် သုံးနိုင်ချိန်",
    goToVerify: "ကီးအတည်ပြုရန် သွားပါ",
    invalidKeyOrExpired: "ကီးမှားနေသည် သို့မဟုတ် လင့်ခ်သက်တမ်းကုန်သွားပါပြီ",
    workerKey: "လုပ်သားကီး",
    workerKeyPlaceholder: "ကီးထည့်ပါ",
    confirm: "အတည်ပြုပါ",
    today: "ဒီနေ့",
    todayWork: "ဒီနေ့အလုပ်များ",
    greeting: "မင်္ဂလာပါ",
    linkCanBeUsedUntil: "ဒီလင့်ခ် သုံးနိုင်ချိန်",
    addEntry: "စာရင်းထည့်ပါ",
    visibleTasks: "ခေါင်းဆောင်က ပြထားသောအလုပ်များ",
    starts: "စတင်",
    repeatsEvery: "နေ့တိုင်းပြန်လုပ်",
    days: "ရက်",
    noVisibleTasks: "လုပ်သားများမြင်နိုင်သောအလုပ် မရှိသေးပါ",
    noEntries: "စာရင်းမရှိသေးပါ",
    delete: "ဖျက်မည်",
    edit: "ပြင်မည်",
    worker: "လုပ်သား",
  },
  en: {
    workerEntry: "Worker Entry",
    workerVerification: "Worker Verification",
    verifyWorkerKeyTitle: "Verify worker key",
    enterPersonalKey: "Enter your personal key",
    linkValidUntil: "This link is valid until",
    goToVerify: "Go to verification",
    invalidKeyOrExpired: "The key is incorrect or this link has expired.",
    workerKey: "Worker key",
    workerKeyPlaceholder: "Enter key",
    confirm: "Confirm",
    today: "Today",
    todayWork: "Today's work",
    greeting: "Hello",
    linkCanBeUsedUntil: "This link can be used until",
    addEntry: "Add entry",
    visibleTasks: "Tasks visible to workers",
    starts: "Starts",
    repeatsEvery: "Repeats every",
    days: "days",
    noVisibleTasks: "No worker-visible tasks yet.",
    noEntries: "No entries yet.",
    delete: "Delete",
    edit: "Edit",
    worker: "worker",
  },
} satisfies Record<SupportedLocale, Record<string, string>>;

export function isSupportedLocale(value: string | undefined): value is SupportedLocale {
  return supportedLocales.includes(value as SupportedLocale);
}
