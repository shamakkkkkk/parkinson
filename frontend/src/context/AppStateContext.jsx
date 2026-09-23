import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { experimentApi } from "../api/experimentApi";
import { normalizeCandidate } from "../utils/candidateFilters";
import { getAgeFromDateOfBirth } from "../utils/age";
import { useAuth } from "./AuthContext";

const AppStateContext = createContext(null);

export const CONDITIONS = [
  { key: "Normal", label: "Normal Steps", fullLabel: "Condition 1: Normal Steps" },
  { key: "Large", label: "Large Steps", fullLabel: "Condition 2: Large Steps" },
  { key: "ExtraLarge", label: "Extra Large Steps", fullLabel: "Condition 3: Extra Large Steps" },
];

function mapExperimentToCandidate(experiment) {
  const properties = experiment.properties || {};
  const normalizedAge =
    experiment.age ?? properties.age ?? getAgeFromDateOfBirth(properties.dateOfBirth) ?? null;

  return normalizeCandidate({
    id: experiment.id || experiment.patientNumber,
    patientNumber: experiment.patientNumber || experiment.id,
    age: normalizedAge,
    height: experiment.height,
    weight: experiment.weight,
    createdAt: experiment.createdAt,
    properties: {
      notes: properties.notes || "",
      parkinsonsStatus: properties.parkinsonsStatus ?? "",
      sessionDate: properties.sessionDate || (experiment.createdAt || "").slice(0, 10),
      dateOfBirth: properties.dateOfBirth || "",
      gender: properties.gender || "",
      age: normalizedAge,
      completed: properties.completed === "true",
      completedAt: properties.completedAt || null,
    },
  });
}

/**
 * Each "candidate" IS an experiment on the data platform (one experiment =
 * one recorded session for one participant) - the previous version of this
 * app invented a second, parallel "sessions" concept on top of candidates,
 * tracked only in localStorage, which could drift out of sync with the
 * backend and didn't actually match the data platform's model. Removing
 * that layer removes a whole class of "candidate says X, session says Y"
 * bugs.
 */
export function AppStateProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [candidates, setCandidates] = useState([]);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [activeCandidateId, setActiveCandidateId] = useState(null);

  const refreshCandidates = useCallback(async () => {
    setIsLoadingCandidates(true);
    setLoadError(null);
    try {
      // The server caps pageSize at 100 (see experiment-api/openapi.yaml),
      // so a single request silently truncates past 100 experiments. Page
      // through everything it reports via `total`, capped at a generous
      // safety limit so a malformed `total` can't spin this forever.
      const pageSize = 100;
      const maxPages = 50; // up to 5,000 experiments
      let page = 1;
      let allItems = [];
      let total = Infinity;

      while (allItems.length < total && page <= maxPages) {
        const response = await experimentApi.listExperiments(page, pageSize);
        const items = response?.items || [];
        allItems = allItems.concat(items);
        total = Number.isFinite(response?.total) ? response.total : allItems.length;
        if (items.length === 0) break; // avoid looping forever on an unexpected response shape
        page += 1;
      }

      const mapped = allItems.map(mapExperimentToCandidate);
      setCandidates(mapped);
      return mapped;
    } catch (error) {
      setLoadError(error?.message || "Failed to load candidates.");
      throw error;
    } finally {
      setIsLoadingCandidates(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      void refreshCandidates();
    } else {
      setCandidates([]);
      setActiveCandidateId(null);
    }
  }, [isAuthenticated, refreshCandidates]);

  const currentCandidate = useMemo(
    () => candidates.find((candidate) => candidate.id === activeCandidateId) || null,
    [activeCandidateId, candidates],
  );

  const addCandidate = useCallback(
    async (candidateInput) => {
      const payload = {
        patientNumber: candidateInput.id,
        age: candidateInput.age,
        height: candidateInput.height,
        weight: candidateInput.weight,
        properties: {
          notes: candidateInput.properties?.notes || "",
          parkinsonsStatus: candidateInput.properties?.parkinsonsStatus ?? "Unknown",
          sessionDate: candidateInput.properties?.sessionDate || new Date().toISOString().slice(0, 10),
          gender: candidateInput.properties?.gender || "",
        },
      };

      const createdExperiment = await experimentApi.createExperiment(payload);
      await refreshCandidates();
      return mapExperimentToCandidate(createdExperiment);
    },
    [refreshCandidates],
  );

  const deleteCandidate = useCallback(async (candidateId) => {
    await experimentApi.deleteExperiment(candidateId);
    setCandidates((prev) => prev.filter((candidate) => candidate.id !== candidateId));
    setActiveCandidateId((prev) => (prev === candidateId ? null : prev));
  }, []);

  const markCandidateCompleted = useCallback(async (candidateId) => {
    const completedAt = new Date().toISOString();
    // The data platform's PATCH /experiments/:id REPLACES `properties`
    // wholesale rather than merging it (confirmed against experiment-api's
    // implementation) - sending only {completed, completedAt} would have
    // silently wiped out room/notes/parkinsonsStatus/gender/etc. for every
    // experiment marked complete. Fetch the current properties first and
    // merge client-side before writing back.
    const current = await experimentApi.getExperiment(candidateId);
    await experimentApi.updateExperiment(candidateId, {
      properties: { ...(current?.properties || {}), completed: "true", completedAt },
    });
    setCandidates((prev) =>
      prev.map((candidate) =>
        candidate.id === candidateId
          ? { ...candidate, properties: { ...candidate.properties, completed: true, completedAt } }
          : candidate,
      ),
    );
  }, []);

  const value = useMemo(
    () => ({
      candidates,
      isLoadingCandidates,
      loadError,
      refreshCandidates,
      activeCandidateId,
      setActiveCandidateId,
      currentCandidate,
      addCandidate,
      deleteCandidate,
      markCandidateCompleted,
    }),
    [
      candidates,
      isLoadingCandidates,
      loadError,
      refreshCandidates,
      activeCandidateId,
      currentCandidate,
      addCandidate,
      deleteCandidate,
      markCandidateCompleted,
    ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within AppStateProvider");
  }
  return context;
}
