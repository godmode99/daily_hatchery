export function calculateRequiredDosingVolumeLiters(input: {
  targetConcentrationCellsPerMl: number;
  waterVolumeLiters: number;
  measuredConcentrationCellsPerMl: number;
}) {
  if (input.measuredConcentrationCellsPerMl <= 0) {
    throw new Error("Measured concentration must be greater than zero.");
  }

  return (
    (input.targetConcentrationCellsPerMl * input.waterVolumeLiters) /
    input.measuredConcentrationCellsPerMl
  );
}

export function calculateNurseryCounts(input: {
  counts: number[];
  dilutionWaterVolumeLiters: number;
}) {
  if (input.counts.length === 0) {
    throw new Error("At least one count value is required.");
  }

  if (input.dilutionWaterVolumeLiters <= 0) {
    throw new Error("Dilution water volume must be greater than zero.");
  }

  const totalCount = input.counts.reduce((sum, count) => sum + count, 0);
  const averageCount = totalCount / input.counts.length;
  const totalCells = averageCount * input.dilutionWaterVolumeLiters * 1000;
  const densityCellsPerMl = totalCells / (input.dilutionWaterVolumeLiters * 1000);

  return {
    averageCount,
    totalCells,
    densityCellsPerMl,
  };
}
