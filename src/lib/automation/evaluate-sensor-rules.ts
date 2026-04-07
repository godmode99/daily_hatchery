import type { ThresholdOperator } from "@prisma/client";
import { getPrisma } from "@/lib/db/prisma";

type RuleActionResult = {
  ruleId: string;
  ruleName: string;
  matched: boolean;
  detail: string;
  queuedCommands: number;
};

export async function evaluateSensorAutomationRules(): Promise<RuleActionResult[]> {
  const prisma = getPrisma();
  const rules = await prisma.automationRule.findMany({
    where: {
      isActive: true,
      ruleType: "SENSOR_THRESHOLD",
    },
    include: {
      sensorConditions: { include: { sensor: true } },
      actions: { include: { actuator: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const results: RuleActionResult[] = [];

  for (const rule of rules) {
    const conditionResults = await Promise.all(
      rule.sensorConditions.map(async (condition) => {
        const latestReading = await prisma.sensorReading.findFirst({
          where: { sensorId: condition.sensorId },
          orderBy: { readingTime: "desc" },
        });

        if (!latestReading) {
          return {
            matched: false,
            detail: `${condition.sensor.code}: no reading`,
          };
        }

        const matched = compareReading(
          latestReading.readingValue,
          condition.operator,
          condition.thresholdValue,
        );

        return {
          matched,
          detail: `${condition.sensor.code} ${latestReading.readingValue} ${condition.operator} ${condition.thresholdValue}`,
        };
      }),
    );

    const isMatched = conditionResults.length > 0 && conditionResults.every((result) => result.matched);
    let queuedCommands = 0;

    if (isMatched) {
      for (const action of rule.actions) {
        const existingPending = await prisma.actuatorCommand.findFirst({
          where: {
            actuatorId: action.actuatorId,
            automationRuleId: rule.id,
            commandType: action.commandType,
            executionStatus: { in: ["PENDING", "EXECUTING"] },
          },
          select: { id: true },
        });

        if (existingPending || !action.actuator.isActive) {
          continue;
        }

        await prisma.actuatorCommand.create({
          data: {
            actuatorId: action.actuatorId,
            commandType: action.commandType,
            commandSource: "RULE",
            automationRuleId: rule.id,
            executionStatus: "PENDING",
          },
        });
        queuedCommands += 1;
      }
    }

    await prisma.automationRuleExecutionLog.create({
      data: {
        automationRuleId: rule.id,
        matchedAt: new Date(),
        executionStatus: isMatched ? "SUCCESS" : "CANCELLED",
        details: conditionResults.map((result) => result.detail).join("; "),
      },
    });

    results.push({
      ruleId: rule.id,
      ruleName: rule.name,
      matched: isMatched,
      detail: conditionResults.map((result) => result.detail).join("; "),
      queuedCommands,
    });
  }

  return results;
}

function compareReading(value: number, operator: ThresholdOperator, threshold: number) {
  if (operator === "GT") {
    return value > threshold;
  }

  if (operator === "GTE") {
    return value >= threshold;
  }

  if (operator === "LT") {
    return value < threshold;
  }

  if (operator === "LTE") {
    return value <= threshold;
  }

  return value === threshold;
}
