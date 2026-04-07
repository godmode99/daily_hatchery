"use server";

import { TelegramRoomType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { evaluateSensorAutomationRules } from "@/lib/automation/evaluate-sensor-rules";
import { getPrisma } from "@/lib/db/prisma";
import { requireApprovedAdmin, requireOwner } from "@/lib/permissions/require-admin";
import { buildDailySummaryMessage } from "@/lib/reports/daily-summary";
import { withSchedulerExecutionLog } from "@/lib/system/scheduler-log";
import { sendTelegramMessage } from "@/lib/telegram/client";
import { generateDailyLink } from "@/lib/worker/daily-link-generator";

export async function createPersonAction(formData: FormData) {
  await requireApprovedAdmin();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const defaultRole = String(formData.get("defaultRole") ?? "WORKER");

  if (!displayName) {
    redirect("/admin/people?error=missing-name");
  }

  await getPrisma().person.create({
    data: {
      displayName,
      defaultRole: defaultRole === "HEAD" ? "HEAD" : "WORKER",
      isActive: true,
    },
  });

  revalidatePath("/admin/people");
  redirect("/admin/people");
}

export async function createWorkerKeyAction(formData: FormData) {
  await requireApprovedAdmin();
  const personId = String(formData.get("personId") ?? "").trim();
  const keyValue = String(formData.get("keyValue") ?? "").trim();

  if (!personId || !keyValue) {
    redirect("/admin/keys?error=missing-field");
  }

  await getPrisma().workerKey.create({
    data: {
      personId,
      keyValue,
      keyMasked: maskWorkerKey(keyValue),
      status: "ACTIVE",
    },
  });

  revalidatePath("/admin/keys");
  redirect("/admin/keys");
}

export async function generateDailyLinkAction() {
  await requireApprovedAdmin();
  await generateDailyLink({ forceNew: true });
  revalidatePath("/admin");
  redirect("/admin?dailyLink=sent");
}

export async function createDropdownItemAction(formData: FormData) {
  await requireApprovedAdmin();
  const group = String(formData.get("group") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const nameEn = String(formData.get("nameEn") ?? "").trim();
  const nameTh = String(formData.get("nameTh") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim() || null;

  if (group === "plankton" && (nameEn || nameTh)) {
    await getPrisma().planktonType.create({
      data: {
        nameEn: nameEn || nameTh,
        nameTh: nameTh || null,
      },
    });
  }

  if (group === "growout" && name) {
    await getPrisma().growoutLocation.create({
      data: { name, code },
    });
  }

  if (group === "water-prep" && name) {
    await getPrisma().waterPrepPoint.create({
      data: { name, code },
    });
  }

  revalidatePath("/admin/dropdowns");
  redirect("/admin/dropdowns");
}

export async function toggleDropdownItemAction(formData: FormData) {
  await requireApprovedAdmin();
  const group = String(formData.get("group") ?? "");
  const id = String(formData.get("id") ?? "");
  const isActive = String(formData.get("isActive") ?? "") === "true";

  if (!id) {
    redirect("/admin/dropdowns");
  }

  if (group === "plankton") {
    await getPrisma().planktonType.update({ where: { id }, data: { isActive } });
  }

  if (group === "growout") {
    await getPrisma().growoutLocation.update({ where: { id }, data: { isActive } });
  }

  if (group === "water-prep") {
    await getPrisma().waterPrepPoint.update({ where: { id }, data: { isActive } });
  }

  revalidatePath("/admin/dropdowns");
  redirect("/admin/dropdowns");
}

export async function updateFoodDestinationSettingAction(formData: FormData) {
  const accessState = await requireApprovedAdmin();
  const growoutLocationId = String(formData.get("growoutLocationId") ?? "");
  const targetConcentrationCellsPerMl = Number(formData.get("targetConcentrationCellsPerMl"));
  const waterVolumeLiters = Number(formData.get("waterVolumeLiters"));

  if (
    !growoutLocationId ||
    !Number.isFinite(targetConcentrationCellsPerMl) ||
    targetConcentrationCellsPerMl <= 0 ||
    !Number.isFinite(waterVolumeLiters) ||
    waterVolumeLiters <= 0
  ) {
    redirect("/admin/calculations?error=validation");
  }

  await getPrisma().$transaction(async (tx) => {
    await tx.foodDestinationSetting.updateMany({
      where: { growoutLocationId, isActive: true },
      data: { isActive: false },
    });

    await tx.foodDestinationSetting.create({
      data: {
        growoutLocationId,
        targetConcentrationCellsPerMl,
        waterVolumeLiters,
        effectiveFrom: new Date(),
        isActive: true,
        updatedByAdminAccountId: accessState.adminAccount.id,
      },
    });
  });

  revalidatePath("/admin/calculations");
  redirect("/admin/calculations");
}

export async function updateNurserySettingAction(formData: FormData) {
  const accessState = await requireApprovedAdmin();
  const defaultDilutionVolumeLiters = Number(formData.get("defaultDilutionVolumeLiters"));

  if (!Number.isFinite(defaultDilutionVolumeLiters) || defaultDilutionVolumeLiters <= 0) {
    redirect("/admin/calculations?error=validation");
  }

  await getPrisma().$transaction(async (tx) => {
    await tx.nurserySetting.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    await tx.nurserySetting.create({
      data: {
        defaultDilutionVolumeLiters,
        isActive: true,
        updatedByAdminAccountId: accessState.adminAccount.id,
      },
    });
  });

  revalidatePath("/admin/calculations");
  redirect("/admin/calculations");
}

export async function createForwardTaskAction(formData: FormData) {
  const accessState = await requireApprovedAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const startDateRaw = String(formData.get("startDate") ?? "");
  const repeatEveryNDays = Number(formData.get("repeatEveryNDays"));
  const isTelegramEnabled = formData.get("isTelegramEnabled") === "on";
  const isVisibleToWorkers = formData.get("isVisibleToWorkers") === "on";

  if (
    !name ||
    !startDateRaw ||
    !Number.isInteger(repeatEveryNDays) ||
    repeatEveryNDays <= 0
  ) {
    redirect("/admin/tasks?error=validation");
  }

  await getPrisma().forwardTask.create({
    data: {
      name,
      description,
      startDate: new Date(`${startDateRaw}T00:00:00+07:00`),
      repeatEveryNDays,
      isTelegramEnabled,
      isVisibleToWorkers,
      isActive: true,
      createdByAdminAccountId: accessState.adminAccount.id,
      updatedByAdminAccountId: accessState.adminAccount.id,
    },
  });

  revalidatePath("/admin/tasks");
  redirect("/admin/tasks");
}

export async function toggleForwardTaskAction(formData: FormData) {
  const accessState = await requireApprovedAdmin();
  const id = String(formData.get("id") ?? "");
  const isActive = String(formData.get("isActive") ?? "") === "true";

  if (!id) {
    redirect("/admin/tasks");
  }

  await getPrisma().forwardTask.update({
    where: { id },
    data: {
      isActive,
      updatedByAdminAccountId: accessState.adminAccount.id,
    },
  });

  revalidatePath("/admin/tasks");
  redirect("/admin/tasks");
}

export async function updateAdminAccountApprovalAction(formData: FormData) {
  const ownerAccess = await requireOwner();
  const adminAccountId = String(formData.get("adminAccountId") ?? "").trim();
  const intent = String(formData.get("intent") ?? "").trim();
  const adminRole = String(formData.get("adminRole") ?? "HEAD") === "OWNER" ? "OWNER" : "HEAD";

  if (!adminAccountId) {
    redirect("/admin/accounts?error=missing-account");
  }

  if (adminAccountId === ownerAccess.adminAccount.id && intent !== "approve") {
    redirect("/admin/accounts?error=self-protection");
  }

  const prisma = getPrisma();
  const targetAccount = await prisma.adminAccount.findUnique({
    where: { id: adminAccountId },
    select: { id: true, personId: true },
  });

  if (!targetAccount) {
    redirect("/admin/accounts?error=not-found");
  }

  if (intent === "approve") {
    await prisma.$transaction(async (tx) => {
      await tx.adminAccount.update({
        where: { id: adminAccountId },
        data: {
          adminRole,
          approvalStatus: "APPROVED",
          approvedAt: new Date(),
          approvedByAdminAccountId: ownerAccess.adminAccount.id,
        },
      });

      await tx.person.update({
        where: { id: targetAccount.personId },
        data: { defaultRole: adminRole },
      });
    });
  } else if (intent === "reject") {
    await prisma.adminAccount.update({
      where: { id: adminAccountId },
      data: {
        approvalStatus: "REJECTED",
        approvedAt: null,
        approvedByAdminAccountId: null,
      },
    });
  } else if (intent === "disable") {
    await prisma.adminAccount.update({
      where: { id: adminAccountId },
      data: { approvalStatus: "DISABLED" },
    });
  } else {
    redirect("/admin/accounts?error=invalid-intent");
  }

  revalidatePath("/admin/accounts");
  revalidatePath("/admin");
  redirect("/admin/accounts");
}

export async function createSensorAction(formData: FormData) {
  const accessState = await requireApprovedAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const unit = String(formData.get("unit") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!name || !code || !unit) {
    redirect("/admin/sensors?error=validation");
  }

  await getPrisma().sensor.create({
    data: {
      name,
      code,
      unit,
      description,
      isActive: true,
      createdByAdminAccountId: accessState.adminAccount.id,
      updatedByAdminAccountId: accessState.adminAccount.id,
    },
  });

  revalidatePath("/admin/sensors");
  redirect("/admin/sensors");
}

export async function toggleSensorAction(formData: FormData) {
  const accessState = await requireApprovedAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const isActive = String(formData.get("isActive") ?? "") === "true";

  if (!id) {
    redirect("/admin/sensors");
  }

  await getPrisma().sensor.update({
    where: { id },
    data: {
      isActive,
      updatedByAdminAccountId: accessState.adminAccount.id,
    },
  });

  revalidatePath("/admin/sensors");
  redirect("/admin/sensors");
}

export async function createActuatorAction(formData: FormData) {
  const accessState = await requireApprovedAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!name || !code) {
    redirect("/admin/actuators?error=validation");
  }

  await getPrisma().actuator.create({
    data: {
      name,
      code,
      description,
      isActive: true,
      createdByAdminAccountId: accessState.adminAccount.id,
      updatedByAdminAccountId: accessState.adminAccount.id,
    },
  });

  revalidatePath("/admin/actuators");
  redirect("/admin/actuators");
}

export async function toggleActuatorAction(formData: FormData) {
  const accessState = await requireApprovedAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const isActive = String(formData.get("isActive") ?? "") === "true";

  if (!id) {
    redirect("/admin/actuators");
  }

  await getPrisma().actuator.update({
    where: { id },
    data: {
      isActive,
      updatedByAdminAccountId: accessState.adminAccount.id,
    },
  });

  revalidatePath("/admin/actuators");
  redirect("/admin/actuators");
}

export async function issueActuatorCommandAction(formData: FormData) {
  const accessState = await requireApprovedAdmin();
  const actuatorId = String(formData.get("actuatorId") ?? "").trim();
  const commandType = String(formData.get("commandType") ?? "") === "OFF" ? "OFF" : "ON";

  if (!actuatorId) {
    redirect("/admin/actuators?error=missing-actuator");
  }

  const actuator = await getPrisma().actuator.findUnique({
    where: { id: actuatorId },
    select: { id: true, isActive: true },
  });

  if (!actuator?.isActive) {
    redirect("/admin/actuators?error=inactive-actuator");
  }

  await getPrisma().actuatorCommand.create({
    data: {
      actuatorId,
      commandType,
      commandSource: "MANUAL",
      issuedByAdminAccountId: accessState.adminAccount.id,
      executionStatus: "PENDING",
    },
  });

  revalidatePath("/admin/actuators");
  redirect("/admin/actuators");
}

export async function createAutomationRuleAction(formData: FormData) {
  const accessState = await requireApprovedAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const sensorId = String(formData.get("sensorId") ?? "").trim();
  const operator = String(formData.get("operator") ?? "").trim();
  const thresholdValue = Number(formData.get("thresholdValue"));
  const actuatorId = String(formData.get("actuatorId") ?? "").trim();
  const commandType = String(formData.get("commandType") ?? "") === "OFF" ? "OFF" : "ON";

  if (
    !name ||
    !sensorId ||
    !["GT", "GTE", "LT", "LTE", "EQ"].includes(operator) ||
    !Number.isFinite(thresholdValue) ||
    !actuatorId
  ) {
    redirect("/admin/automation?error=validation");
  }

  await getPrisma().automationRule.create({
    data: {
      name,
      description,
      ruleType: "SENSOR_THRESHOLD",
      isActive: true,
      createdByAdminAccountId: accessState.adminAccount.id,
      updatedByAdminAccountId: accessState.adminAccount.id,
      sensorConditions: {
        create: {
          sensorId,
          operator: operator as "GT" | "GTE" | "LT" | "LTE" | "EQ",
          thresholdValue,
        },
      },
      actions: {
        create: {
          actuatorId,
          commandType,
        },
      },
    },
  });

  revalidatePath("/admin/automation");
  redirect("/admin/automation");
}

export async function toggleAutomationRuleAction(formData: FormData) {
  const accessState = await requireApprovedAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const isActive = String(formData.get("isActive") ?? "") === "true";

  if (!id) {
    redirect("/admin/automation");
  }

  await getPrisma().automationRule.update({
    where: { id },
    data: {
      isActive,
      updatedByAdminAccountId: accessState.adminAccount.id,
    },
  });

  revalidatePath("/admin/automation");
  redirect("/admin/automation");
}

export async function runDailySummaryNowAction() {
  await requireOwner();

  await withSchedulerExecutionLog({
    jobName: "daily-summary-send-manual",
    triggerContext: "admin/system",
    run: async () => {
      const message = await buildDailySummaryMessage();

      return sendTelegramMessage({
        roomType: TelegramRoomType.DAILY_SUMMARY,
        messageType: "DAILY_SUMMARY_MANUAL",
        payloadText: message,
      });
    },
    details: (telegramLog) => `telegramLogId=${telegramLog.id}; sendStatus=${telegramLog.sendStatus}`,
  });

  revalidatePath("/admin/system");
  revalidatePath("/admin/activity");
  redirect("/admin/system?job=daily-summary");
}

export async function runAutomationEvaluateNowAction() {
  await requireOwner();

  await withSchedulerExecutionLog({
    jobName: "automation-evaluate-manual",
    triggerContext: "admin/system",
    run: evaluateSensorAutomationRules,
    details: (results) =>
      `evaluatedRules=${results.length}; queuedCommands=${results.reduce((sum, result) => sum + result.queuedCommands, 0)}`,
  });

  revalidatePath("/admin/system");
  revalidatePath("/admin/activity");
  revalidatePath("/admin/actuators");
  revalidatePath("/admin/automation");
  redirect("/admin/system?job=automation-evaluate");
}

function maskWorkerKey(keyValue: string) {
  if (keyValue.length <= 4) {
    return "*".repeat(keyValue.length);
  }

  return `${keyValue.slice(0, 2)}${"*".repeat(Math.max(2, keyValue.length - 4))}${keyValue.slice(-2)}`;
}
