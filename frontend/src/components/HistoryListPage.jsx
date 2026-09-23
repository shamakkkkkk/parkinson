import { useLocation } from "wouter";
import { useMemo } from "react";
import AppLayout from "./AppLayout";
import PageHeader from "./ui/PageHeader";
import Button from "./ui/Button";
import EmptyState from "./ui/EmptyState";
import Loading from "./ui/Loading";
import Banner from "./ui/Banner";
import { useAppState } from "../context/AppStateContext";

export default function HistoryListPage() {
  const [, setLocation] = useLocation();
  const { candidates, isLoadingCandidates, loadError } = useAppState();

  const completedCandidates = useMemo(
    () =>
      candidates
        .filter((candidate) => candidate.properties?.completed)
        .sort((a, b) => new Date(b.properties?.completedAt || 0) - new Date(a.properties?.completedAt || 0)),
    [candidates],
  );

  return (
    <AppLayout>
      <PageHeader eyebrow="Review" title="Experiments History" description="All completed recording sessions." />
      <Banner tone="error">{loadError}</Banner>

      {isLoadingCandidates ? (
        <Loading label="Loading history..." />
      ) : completedCandidates.length === 0 ? (
        <EmptyState title="No experiments recorded yet." description="Completed sessions will show up here." />
      ) : (
        <div className="stack">
          {completedCandidates.map((candidate) => (
            <button
              key={candidate.id}
              className="list-row"
              style={{ width: "100%", textAlign: "left", cursor: "pointer" }}
              onClick={() => setLocation(`/history/${candidate.id}`)}
            >
              <div>
                <div className="list-row-title">Candidate {candidate.patientNumber}</div>
                <div className="list-row-meta">
                  {candidate.properties?.completedAt
                    ? new Date(candidate.properties.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                    : "Date unavailable"}
                </div>
              </div>
              <span className="text-muted">View results &rarr;</span>
            </button>
          ))}
        </div>
      )}

      <Button variant="back" fullWidth onClick={() => setLocation("/")} className="mt-6">
        Go back
      </Button>
    </AppLayout>
  );
}
