function clampSeries(values) {
  return values
    .map((value, index) => ({
      x: index + 1,
      y: Number(value),
    }))
    .filter((point) => Number.isFinite(point.y));
}

export function buildExerciseMetricSeries(exerciseData, metricType) {
  if (!exerciseData) {
    return [];
  }

  switch (metricType) {
    case 'stepLength': {
      const values = exerciseData?.aggregates?.stepLengths?.values || [];
      return clampSeries(values);
    }
    case 'mouthOpening': {
      const values = exerciseData?.mouthOpening?.values || [];
      const series = values
        .map(([vertical = 0, horizontal = 0], index) => ({
          x: index + 1,
          y: Math.sqrt((Number(vertical) || 0) ** 2 + (Number(horizontal) || 0) ** 2) * 100,
        }))
        .filter((point) => Number.isFinite(point.y));
      return series.length > 0 ? series : [];
    }
    case 'soundPressure': {
      const values = exerciseData?.soundPressure?.values || [];
      return clampSeries(values);
    }
    case 'movementSpeed': {
      const values = exerciseData?.footSpeed?.values || [];
      return clampSeries(values);
    }
    default:
      return [];
  }
}

export function buildExerciseMetrics(exerciseData) {
  return {
    stepLength: buildExerciseMetricSeries(exerciseData, 'stepLength'),
    mouthOpening: buildExerciseMetricSeries(exerciseData, 'mouthOpening'),
    soundPressure: buildExerciseMetricSeries(exerciseData, 'soundPressure'),
    movementSpeed: buildExerciseMetricSeries(exerciseData, 'movementSpeed'),
  };
}
