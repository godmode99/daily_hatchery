import { NextResponse } from "next/server";
import { evaluateSensorAutomationRules } from "@/lib/automation/evaluate-sensor-rules";
import { requireSystemCron } from "@/lib/system/cron-auth";
import { withSchedulerExecutionLog } from "@/lib/system/scheduler-log";

export async function GET(request: Request) {
  return handleEvaluate(request);
}

export async function POST(request: Request) {
  return handleEvaluate(request);
}

async function handleEvaluate(request: Request) {
  const authError = requireSystemCron(request);

  if (authError) {
    return authError;
  }

  const { result: results, schedulerLogId } = await withSchedulerExecutionLog({
    jobName: "automation-evaluate",
    triggerContext: "api/system/automation/evaluate",
    run: evaluateSensorAutomationRules,
    details: (evaluatedResults) =>
      `evaluatedRules=${evaluatedResults.length}; queuedCommands=${evaluatedResults.reduce((sum, result) => sum + result.queuedCommands, 0)}`,
  });

  return NextResponse.json({
    ok: true,
    schedulerLogId,
    evaluatedRules: results.length,
    queuedCommands: results.reduce((sum, result) => sum + result.queuedCommands, 0),
    results,
  });
}
