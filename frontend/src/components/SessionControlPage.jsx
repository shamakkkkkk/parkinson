import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import AppLayout from "./AppLayout";
import Button from "./ui/Button";
import FormField from "./ui/FormField";
import Banner from "./ui/Banner";
import Loading from "./ui/Loading";
import EmptyState from "./ui/EmptyState";
import { useAppState, CONDITIONS } from "../context/AppStateContext";
import { useToast } from "../context/ToastContext";
import { useExerciseRecorder } from "../hooks/useExerciseRecorder";

function formatDuration(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function exerciseStatusLabel(exercise) {
  if (exercise.recordingStatus === "recording") return "Recording";
  if (exercise.hasData || exercise.recordingStatus === "stopped") return "Recorded";
  return "Ready";
}

function exerciseStatusClass(exercise) {
  const label = exerciseStatusLabel(exercise);
  if (label === "Recording") return "status-recording";
  if (label === "Recorded") return "status-recorded";
  return "status-ready";
}

export default function SessionControlPage({ params }) {
  const [, setLocation] = useLocation();
  const { candidates, currentCandidate, setActiveCandidateId, markCandidateCompleted } = useAppState();
  const toast = useToast();
  const experimentId = params?.id;

  const {
    exercises,
    isLoading,
    isBusy,
    error,
    activeExerciseId,
    elapsedSeconds,
    startRecording,
    stopRecording,
    removeExercise,
  } = useExerciseRecorder(experimentId);

  const [selectedConditionKey, setSelectedConditionKey] = useState(CONDITIONS[0].key);
  const [annotation, setAnnotation] = useState("");
  const [selectedExerciseId, setSelectedExerciseId] = useState(null);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    if (experimentId && experimentId !== currentCandidate?.id) {
      setActiveCandidateId(experimentId);
    }
  }, [experimentId, currentCandidate?.id, setActiveCandidateId]);

  const candidate = useMemo(
    () => currentCandidate || candidates.find((c) => c.id === experimentId) || null,
    [currentCandidate, candidates, experimentId],
  );

  const selectedExercise = exercises.find((exercise) => exercise.id === selectedExerciseId) || null;
  const isRecording = Boolean(activeExerciseId);
  const canComplete = exercises.some((exercise) => exercise.hasData) && !isRecording;

  async function handleStartRecording() {
    const conditionMeta = CONDITIONS.find((c) => c.key === selectedConditionKey);
    try {
      const id = await startRecording({
        conditionKey: selectedConditionKey,
        conditionLabel: conditionMeta.fullLabel,
        annotation,
      });
      setSelectedExerciseId(id);
      setAnnotation("");
    } catch (err) {
      toast.error(err?.message || "Could not start recording.");
    }
  }

  async function handleStopRecording() {
    try {
      await stopRecording();
      toast.success("Exercise recorded.");
    } catch (err) {
      toast.error(err?.message || "Could not stop recording.");
    }
  }

  async function handleDeleteExercise(exerciseId) {
    try {
      await removeExercise(exerciseId);
      if (selectedExerciseId === exerciseId) setSelectedExerciseId(null);
    } catch (err) {
      toast.error(err?.message || "Could not delete exercise.");
    }
  }

  async function handleCompleteExperiment() {
    setIsCompleting(true);
    try {
      await markCandidateCompleted(experimentId);
      setLocation(`/experiment/${experimentId}/results`);
    } catch (err) {
      toast.error(err?.message || "Could not complete the experiment.");
    } finally {
      setIsCompleting(false);
    }
  }

  return (
    <AppLayout wide>
      <div className="experiment-badge">
        Active Candidate: {candidate?.patientNumber || experimentId}
      </div>
      <h2>Experiment Control Panel</h2>
      <Banner tone="error">{error}</Banner>

      <div className="experiment-layout mt-4">
        <aside className="control-panel">
          <h3>Experiment Structure</h3>
          <div className="trial-builder-row">
            <FormField
              label="Condition"
              type="select"
              value={selectedConditionKey}
              onChange={(e) => setSelectedConditionKey(e.target.value)}
              options={CONDITIONS.map((c) => ({ value: c.key, label: c.label }))}
              disabled={isRecording}
            />
          </div>

          {isLoading ? (
            <Loading label="Loading exercises..." />
          ) : exercises.length === 0 ? (
            <EmptyState title="No exercises yet" description="Start a recording to create the first one." />
          ) : (
            <div className="exercise-list">
              {exercises.map((exercise, index) => (
                <button
                  key={exercise.id}
                  className={`exercise-card ${selectedExerciseId === exercise.id ? "is-active" : ""}`}
                  onClick={() => setSelectedExerciseId(exercise.id)}
                >
                  <div className="exercise-card-title">Exercise {index + 1}</div>
                  <div className="exercise-card-meta">{exercise.properties?.conditionName || "Unlabeled condition"}</div>
                  <span className={`status-pill ${exerciseStatusClass(exercise)}`}>{exerciseStatusLabel(exercise)}</span>
                </button>
              ))}
            </div>
          )}
        </aside>

        <section className="recording-panel">
          <div className={`recording-status-card ${isRecording ? "is-recording" : ""}`}>
            <div>
              <span className="timer-label">Condition</span>
              <div style={{ fontWeight: 700 }}>{CONDITIONS.find((c) => c.key === selectedConditionKey)?.label}</div>
            </div>
            <div>
              <span className="timer-label">Exercises recorded</span>
              <div style={{ fontWeight: 700 }}>{exercises.length}</div>
            </div>
            <div>
              <span className="timer-label">Status</span>
              <div style={{ fontWeight: 700 }}>{isRecording ? "Recording" : "Ready"}</div>
            </div>
          </div>

          <div className="instruction-banner">
            <span aria-hidden="true">&#128172;</span>
            <span>
              Ask the candidate to perform <strong>{CONDITIONS.find((c) => c.key === selectedConditionKey)?.label}</strong>.
              Say the syllable &ldquo;Ba&rdquo; with every step. Add notes below, then press Start to begin sensor logging.
            </span>
          </div>

          <FormField
            label="Exercise annotation / notes"
            type="textarea"
            placeholder="e.g. patient stumbled, voice tremor, low intensity..."
            value={annotation}
            onChange={(e) => setAnnotation(e.target.value)}
            disabled={isRecording}
            hint="Notes are attached when the recording starts (the data platform doesn't support editing them afterwards)."
          />

          <div>
            <div className="timer-label">Recording Timer</div>
            <div className="timer-display">{formatDuration(elapsedSeconds)}</div>
          </div>

          <div className="record-controls">
            {isRecording ? (
              <button className="record-toggle-btn stop" onClick={handleStopRecording} disabled={isBusy}>
                {isBusy ? "Stopping..." : "\u23F9 Stop & Save Exercise"}
              </button>
            ) : (
              <button className="record-toggle-btn start" onClick={handleStartRecording} disabled={isBusy}>
                {isBusy ? "Starting..." : "\u25B6 Start Recording"}
              </button>
            )}
            {selectedExercise ? (
              <Button variant="danger" onClick={() => handleDeleteExercise(selectedExercise.id)} disabled={isRecording || isBusy}>
                Delete Selected Exercise
              </Button>
            ) : null}
          </div>
        </section>
      </div>

      <div className="mt-6 stack">
        <Button variant="primary" fullWidth onClick={handleCompleteExperiment} disabled={!canComplete} loading={isCompleting}>
          &#127937; Complete Full Experiment & View Results
        </Button>
        <Button variant="back" fullWidth onClick={() => setLocation("/candidates")}>
          Go back
        </Button>
      </div>
    </AppLayout>
  );
}
