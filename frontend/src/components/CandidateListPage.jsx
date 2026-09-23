import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import AppLayout from "./AppLayout";
import PageHeader from "./ui/PageHeader";
import Button from "./ui/Button";
import FormField from "./ui/FormField";
import Badge from "./ui/Badge";
import EmptyState from "./ui/EmptyState";
import Loading from "./ui/Loading";
import Banner from "./ui/Banner";
import ConfirmModal from "./ui/ConfirmModal";
import { useAppState } from "../context/AppStateContext";
import { useToast } from "../context/ToastContext";
import { matchesCandidateFilters } from "../utils/candidateFilters";

export default function CandidateListPage() {
  const [, setLocation] = useLocation();
  const { candidates, isLoadingCandidates, loadError, setActiveCandidateId, deleteCandidate } = useAppState();
  const toast = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [ageFilter, setAgeFilter] = useState("all");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const activeCandidates = useMemo(
    () => candidates.filter((candidate) => !candidate.properties?.completed),
    [candidates],
  );

  const filteredCandidates = useMemo(
    () => activeCandidates.filter((candidate) => matchesCandidateFilters(candidate, { searchTerm, statusFilter, genderFilter, ageFilter })),
    [activeCandidates, searchTerm, statusFilter, genderFilter, ageFilter],
  );

  const hasActiveFilters = searchTerm.trim() !== "" || statusFilter !== "all" || genderFilter !== "all" || ageFilter !== "all";

  function resetFilters() {
    setSearchTerm("");
    setStatusFilter("all");
    setGenderFilter("all");
    setAgeFilter("all");
  }

  function handleStartExperiment(candidate) {
    setActiveCandidateId(candidate.id);
    setLocation(`/experiment/${candidate.id}`);
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await deleteCandidate(pendingDelete.id);
      toast.success(`Candidate ${pendingDelete.patientNumber} deleted.`);
      setPendingDelete(null);
    } catch (err) {
      toast.error(err?.message || "Failed to delete candidate.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AppLayout wide>
      <PageHeader eyebrow="Start a session" title="Select Candidate for Experiment" description="Choose a candidate to begin a new experiment." />

      <div className="filter-bar">
        <FormField label="Search by candidate ID" placeholder="Type patient ID" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <div className="filter-grid">
          <FormField
            label="Status"
            type="select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: "all", label: "All statuses" },
              { value: "positive", label: "Parkinson Positive" },
              { value: "negative", label: "Parkinson Negative" },
              { value: "unknown", label: "Unknown" },
            ]}
          />
          <FormField
            label="Gender"
            type="select"
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            options={[
              { value: "all", label: "All genders" },
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
              { value: "other", label: "Other" },
            ]}
          />
          <FormField
            label="Age"
            type="select"
            value={ageFilter}
            onChange={(e) => setAgeFilter(e.target.value)}
            options={[
              { value: "all", label: "All ages" },
              { value: "under40", label: "Under 40" },
              { value: "40to60", label: "40\u201360" },
              { value: "over60", label: "Over 60" },
              { value: "unknown", label: "Unknown" },
            ]}
          />
        </div>
        {hasActiveFilters ? (
          <Button variant="secondary" size="sm" onClick={resetFilters} style={{ justifySelf: "start" }}>
            Clear filters
          </Button>
        ) : null}
      </div>

      <Banner tone="error">{loadError}</Banner>

      {isLoadingCandidates ? (
        <Loading label="Loading candidates..." />
      ) : activeCandidates.length === 0 ? (
        <EmptyState
          title="No candidates available yet."
          description="Create your first candidate to start tracking clinical sessions."
          action={<Button variant="secondary" onClick={() => setLocation("/create-candidate")}>Create Candidate</Button>}
        />
      ) : filteredCandidates.length === 0 ? (
        <EmptyState title="No candidates match the current filters." description="Try changing the search text or any of the filter values." />
      ) : (
        <>
          <div className="filter-summary mt-0" style={{ marginBottom: 12 }}>
            Showing {filteredCandidates.length} of {activeCandidates.length} candidates
          </div>
          <div className="stack">
            {filteredCandidates.map((candidate) => (
              <div key={candidate.id} className="list-row">
                <div>
                  <div className="list-row-title">Candidate: {candidate.patientNumber}</div>
                  <Badge tone={candidate.normalizedStatus === "positive" ? "positive" : candidate.normalizedStatus === "negative" ? "negative" : "neutral"}>
                    {candidate.displayStatus}
                  </Badge>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Age</span>
                      <span className="detail-value">{candidate.normalizedAge ?? "\u2014"}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Gender</span>
                      <span className="detail-value">{candidate.displayGender}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Height</span>
                      <span className="detail-value">{candidate.height ? `${candidate.height} cm` : "\u2014"}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Weight</span>
                      <span className="detail-value">{candidate.weight ? `${candidate.weight} kg` : "\u2014"}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                  <Button variant="danger" size="sm" onClick={() => setPendingDelete(candidate)}>
                    Delete
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => handleStartExperiment(candidate)}>
                    Start
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Button variant="back" fullWidth onClick={() => setLocation("/")} className="mt-6">
        Go back
      </Button>

      <ConfirmModal
        open={Boolean(pendingDelete)}
        title="Delete candidate?"
        description={pendingDelete ? `This removes candidate ${pendingDelete.patientNumber} and all experiments/data for them. This cannot be undone.` : ""}
        confirmLabel="Delete"
        danger
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </AppLayout>
  );
}
