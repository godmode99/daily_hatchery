import { getPrisma } from "@/lib/db/prisma";

type SchedulerLogInput<T> = {
  jobName: string;
  triggerContext: string;
  run: () => Promise<T>;
  details?: (result: T) => string;
};

export async function withSchedulerExecutionLog<T>({
  jobName,
  triggerContext,
  run,
  details,
}: SchedulerLogInput<T>) {
  const prisma = getPrisma();
  const startedAt = new Date();
  const log = await prisma.schedulerExecutionLog.create({
    data: {
      jobName,
      startedAt,
      status: "RUNNING",
      triggerContext,
    },
  });

  try {
    const result = await run();

    await prisma.schedulerExecutionLog.update({
      where: { id: log.id },
      data: {
        finishedAt: new Date(),
        status: "SUCCESS",
        details: details ? details(result) : null,
      },
    });

    return { result, schedulerLogId: log.id };
  } catch (error) {
    await prisma.schedulerExecutionLog.update({
      where: { id: log.id },
      data: {
        finishedAt: new Date(),
        status: "FAILED",
        details: error instanceof Error ? error.message : String(error),
      },
    });

    throw error;
  }
}
