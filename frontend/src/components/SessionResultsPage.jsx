import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import AppLayout from "./AppLayout";
import Button from "./ui/Button";
import Loading from "./ui/Loading";
import Banner from "./ui/Banner";
import EmptyState from "./ui/EmptyState";
import CandidateSummaryCard from "./CandidateSummaryCard";
import ExerciseResultCard from "./ExerciseResultCard";
import { useAppState, CONDITIONS } from "../context/AppStateContext";
import { experimentApi } from "../api/experimentApi";

export default function SessionResultsPage({ params }) {
  const [, setLocation] = useLocation();
  const { candidates, refreshCandidates } = useAppState();
  const experimentId = params?.id;

  const [exercises, setExercises] = useState([]);
  const [exerciseDataById, setExerciseDataById] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const candidate = useMemo(() => candidates.find((c) => c.id === experimentId) || null, [candidates, experimentId]);

  useEffect(() => {
    if (!candidates.some((c) => c.id === experimentId)) {
      void refreshCandidates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [experimentId]);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      if (!experimentId) return;
      setIsLoading(true);
      setError(null);
      try {
        const list = await experimentApi.listExercises(experimentId);
        const items = Array.isArray(list?.items) ? list.items : Array.isArray(list) ? list : [];
        if (!isMounted) return;
        setExercises(items);

        const dataEntries = await Promise.all(
          items
            .filter((exercise) => exercise.hasData)
            .map(async (exercise) => {
              try {
                const data = await experimentApi.getExerciseData(exercise.id);
                return [exercise.id, data];
              } catch {
                return [exercise.id, null];
              }
            }),
        );

        if (isMounted) {
          setExerciseDataById(Object.fromEntries(dataEntries));
        }
      } catch (err) {
        if (isMounted) setError(err?.message || "Failed to load results.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void load();
    return () => {
      isMounted = false;
    };
  }, [experimentId]);

  const groupedByCondition = useMemo(() => {
    const groups = Object.fromEntries(CONDITIONS.map((c) => [c.key, []]));
    for (const exercise of exercises) {
      const key = exercise.properties?.conditionKey;
      if (groups[key]) {
        groups[key].push(exercise);
      }
    }
    return groups;
  }, [exercises]);

  return (
    <AppLayout wide>
      <h2>Experiment Results Matrix</h2>
      {candidate ? <CandidateSummaryCard candidate={candidate} /> : null}
      <Banner tone="error">{error}</Banner>

      {isLoading ? (
        <Loading label="Loading results..." />
      ) : exercises.length === 0 ? (
        <EmptyState title="No results yet for this experiment." />
      ) : (
        CONDITIONS.map((condition) => {
          const conditionExercises = groupedByCondition[condition.key];
          if (conditionExercises.length === 0) return null;
          return (
            <div className="results-section" key={condition.key}>
              <h3>{condition.fullLabel}</h3>
              {conditionExercises.map((exercise, index) => (
                <ExerciseResultCard key={exercise.id} index={index} exercise={exercise} exerciseData={exerciseDataById[exercise.id]} />
              ))}
            </div>
          );
        })
      )}

      <Button variant="back" fullWidth onClick={() => setLocation("/")} className="mt-6">
        Go back
      </Button>
    </AppLayout>
  );
}
