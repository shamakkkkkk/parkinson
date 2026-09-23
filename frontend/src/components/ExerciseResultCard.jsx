import GraphCard from "./GraphCard";
import { buildExerciseMetrics } from "../utils/metricData";

export default function ExerciseResultCard({ index, exercise, exerciseData }) {
  const metrics = buildExerciseMetrics(exerciseData);
  const annotation = exercise?.properties?.annotation;

  return (
    <div className="trial-result-card">
      <h4>&#128205; Exercise {index + 1}</h4>
      {annotation ? (
        <div className="annotation-note">
          <strong>Notes:</strong> {annotation}
        </div>
      ) : null}
      <div className="graph-grid">
        <GraphCard title="Step Length Distribution" yLabel="Length (cm)" xLabel="Step Count" colorKey="step" data={metrics.stepLength} />
        <GraphCard title="Mouth Opening Amplitude" yLabel="Amplitude" xLabel="Sample" colorKey="mouth" data={metrics.mouthOpening} />
        <GraphCard title="Sound Pressure Level" yLabel="Pressure (dB)" xLabel="Sample" colorKey="sound" data={metrics.soundPressure} />
        <GraphCard title="Movement Speed" yLabel="Speed (cm/s)" xLabel="Sample" colorKey="speed" data={metrics.movementSpeed} />
      </div>
    </div>
  );
}
