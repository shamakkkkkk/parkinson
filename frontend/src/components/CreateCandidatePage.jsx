import { useLocation } from "wouter";
import { useMemo, useState } from "react";
import FormField from "./ui/FormField";
import Button from "./ui/Button";
import Banner from "./ui/Banner";
import AppLayout from "./AppLayout";
import PageHeader from "./ui/PageHeader";
import { useAppState } from "../context/AppStateContext";
import { useToast } from "../context/ToastContext";

export default function CreateCandidatePage() {
  const [, setLocation] = useLocation();
  const { addCandidate } = useAppState();
  const toast = useToast();

  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [stage, setStage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const isFormComplete = useMemo(
    () => [age, height, weight, stage, gender].every((value) => String(value).trim() !== ""),
    [age, height, weight, stage, gender],
  );

  async function handleSaveCandidate() {
    setError("");

    const normalizedAge = Number(age);
    const normalizedHeight = Number(height);
    const normalizedWeight = Number(weight);

    if (!age || Number.isNaN(normalizedAge) || normalizedAge < 18 || normalizedAge > 120) {
      setError("Age should be a number between 18 and 120.");
      return;
    }
    if (normalizedHeight < 50 || normalizedHeight > 250) {
      setError("Height should be between 50 and 250 cm.");
      return;
    }
    if (normalizedWeight < 30 || normalizedWeight > 250) {
      setError("Weight should be between 30 and 250 kg.");
      return;
    }

    const patientNumber = `P-${String(Date.now()).slice(-4)}`;

    setIsSaving(true);
    try {
      await addCandidate({
        id: patientNumber,
        age: normalizedAge,
        height: normalizedHeight,
        weight: normalizedWeight,
        properties: {
          notes: "",
          parkinsonsStatus: stage,
          sessionDate: new Date().toISOString().slice(0, 10),
          gender,
        },
      });
      toast.success(`Candidate ${patientNumber} created.`);
      setLocation("/candidates");
    } catch (err) {
      setError(err?.message || "Failed to create candidate.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppLayout>
      <PageHeader eyebrow="New Participant" title="Create a Candidate" description="Fill in the required information to register this participant." />
      <div className="card">
        <Banner tone="error">{error}</Banner>

        <FormField label="Age" type="number" placeholder="e.g. 34" value={age} onChange={(e) => setAge(e.target.value)} min="18" max="120" step="1" required />

        <FormField
          label="Gender"
          type="select"
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          options={[
            { value: "Male", label: "Male" },
            { value: "Female", label: "Female" },
            { value: "Other", label: "Other" },
          ]}
          required
        />

        <FormField label="Height (cm)" type="number" placeholder="e.g. 178" value={height} onChange={(e) => setHeight(e.target.value)} min="50" max="250" step="1" required />

        <FormField label="Weight (kg)" type="number" placeholder="e.g. 75" value={weight} onChange={(e) => setWeight(e.target.value)} min="30" max="250" step="0.1" required />

        <FormField
          label="Parkinson's Disease"
          type="select"
          value={stage}
          onChange={(e) => setStage(e.target.value)}
          options={[
            { value: "Yes", label: "Yes" },
            { value: "No", label: "No" },
          ]}
          required
        />

        <Button variant="primary" fullWidth loading={isSaving} disabled={!isFormComplete} onClick={handleSaveCandidate} className="mt-4">
          Save Candidate
        </Button>
        <Button variant="back" fullWidth onClick={() => setLocation("/")} className="mt-4">
          Go back
        </Button>
      </div>
    </AppLayout>
  );
}
