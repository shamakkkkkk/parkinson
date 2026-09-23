import { useCallback, useEffect, useRef, useState } from "react";
import { experimentApi } from "../api/experimentApi";

/**
 * Encapsulates the recording lifecycle for one experiment's exercises:
 * loading existing exercises, creating + starting a new recording, stopping
 * it, deleting one, and ticking a local timer while recording.
 *
 * This used to be ~250 lines tangled into SessionControlPage itself, mixed
 * with rendering logic. Pulling it into a hook makes each piece testable
 * and lets the component focus on layout.
 */
export function useExerciseRecorder(experimentId) {
  const [exercises, setExercises] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeExerciseId, setActiveExerciseId] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isBusy, setIsBusy] = useState(false);
  const timerRef = useRef(null);

  const load = useCallback(async () => {
    if (!experimentId) return;
    setIsLoading(true);
    setError(null);
    try {
      const list = await experimentApi.listExercises(experimentId);
      setExercises(Array.isArray(list?.items) ? list.items : Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err?.message || "Failed to load exercises.");
    } finally {
      setIsLoading(false);
    }
  }, [experimentId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!activeExerciseId) {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return undefined;
    }

    timerRef.current = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [activeExerciseId]);

  const startRecording = useCallback(
    async ({ conditionKey, conditionLabel, annotation }) => {
      setIsBusy(true);
      setError(null);
      try {
        const created = await experimentApi.createExercise(experimentId, {
          properties: {
            conditionKey,
            conditionName: conditionLabel,
            annotation: annotation || "",
          },
        });
        await experimentApi.startRecording(created.id);
        setElapsedSeconds(0);
        setActiveExerciseId(created.id);
        await load();
        return created.id;
      } catch (err) {
        setError(err?.message || "Failed to start recording.");
        // The exercise may have been created even though start-recording
        // failed (e.g. a network blip between the two calls) - refresh so
        // it's still visible/deletable instead of silently vanishing.
        await load();
        throw err;
      } finally {
        setIsBusy(false);
      }
    },
    [experimentId, load],
  );

  const stopRecording = useCallback(async () => {
    if (!activeExerciseId) return;
    setIsBusy(true);
    setError(null);
    try {
      await experimentApi.stopRecording(activeExerciseId);
      setActiveExerciseId(null);
      setElapsedSeconds(0);
      await load();
    } catch (err) {
      setError(err?.message || "Failed to stop recording.");
      throw err;
    } finally {
      setIsBusy(false);
    }
  }, [activeExerciseId, load]);

  const removeExercise = useCallback(
    async (exerciseId) => {
      setIsBusy(true);
      setError(null);
      try {
        await experimentApi.deleteExercise(exerciseId);
        if (activeExerciseId === exerciseId) {
          setActiveExerciseId(null);
          setElapsedSeconds(0);
        }
        await load();
      } catch (err) {
        setError(err?.message || "Failed to delete exercise.");
        throw err;
      } finally {
        setIsBusy(false);
      }
    },
    [activeExerciseId, load],
  );

  return {
    exercises,
    isLoading,
    isBusy,
    error,
    activeExerciseId,
    elapsedSeconds,
    startRecording,
    stopRecording,
    removeExercise,
    refresh: load,
  };
}
