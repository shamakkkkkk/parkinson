function toText(value) {
  return String(value ?? "").trim();
}

export function normalizeGender(value) {
  const normalized = toText(value).toLowerCase();

  if (["male", "m", "man", "he/him", "male ", "m "].includes(normalized)) {
    return "male";
  }

  if (["female", "f", "woman", "she/her", "female ", "f "].includes(normalized)) {
    return "female";
  }

  if (["other", "non-binary", "nonbinary", "nb", "other ", "non-binary ", "nb "].includes(normalized)) {
    return "other";
  }

  if (["unknown", "", "prefer not to say", "prefer-not-to-say", "not specified", "not-specified"].includes(normalized)) {
    return "unknown";
  }

  return "unknown";
}

export function normalizeStatus(value) {
  const normalized = toText(value).toLowerCase();

  if (["yes", "y", "true", "positive", "parkinson positive", "parkinson-positive"].includes(normalized)) {
    return "positive";
  }

  if (["no", "n", "false", "negative", "parkinson negative", "parkinson-negative"].includes(normalized)) {
    return "negative";
  }

  return "unknown";
}

export function normalizeAge(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const parsed = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeCandidate(candidate) {
  const properties = candidate?.properties || {};
  const rawGender = properties.gender ?? candidate?.gender ?? properties.sex ?? candidate?.sex ?? "";
  const rawStatus = properties.parkinsonsStatus ?? candidate?.parkinsonsStatus ?? properties.status ?? candidate?.status ?? "";
  const rawAge = candidate?.age ?? properties.age ?? candidate?.ageYears ?? null;
  const patientNumber = candidate?.patientNumber || candidate?.id || properties.patientNumber || "";
  const id = candidate?.id || patientNumber || "";

  const normalizedGender = normalizeGender(rawGender);
  const normalizedStatus = normalizeStatus(rawStatus);
  const normalizedAge = normalizeAge(rawAge);

  const searchableText = [
    id,
    patientNumber,
    properties?.notes,
    normalizedGender,
    normalizedStatus,
    normalizedAge,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return {
    ...candidate,
    id,
    patientNumber,
    normalizedGender,
    normalizedStatus,
    normalizedAge,
    searchableText,
    displayStatus: normalizedStatus === "positive"
      ? "Parkinson Positive"
      : normalizedStatus === "negative"
        ? "Parkinson Negative"
        : "Unknown",
    displayGender: normalizedGender === "unknown"
      ? "Unknown"
      : normalizedGender.charAt(0).toUpperCase() + normalizedGender.slice(1),
  };
}

export function matchesCandidateFilters(candidate, { searchTerm, statusFilter, genderFilter, ageFilter }) {
  const normalizedSearch = toText(searchTerm).toLowerCase();
  const candidateAge = normalizeAge(candidate.normalizedAge);

  const matchesSearch = normalizedSearch === ""
    || candidate.searchableText.includes(normalizedSearch)
    || String(candidate.id || "").toLowerCase().includes(normalizedSearch)
    || String(candidate.patientNumber || "").toLowerCase().includes(normalizedSearch);

  const matchesStatus = statusFilter === "all"
    || (statusFilter === "positive" && candidate.normalizedStatus === "positive")
    || (statusFilter === "negative" && candidate.normalizedStatus === "negative")
    || (statusFilter === "unknown" && candidate.normalizedStatus === "unknown");

  const matchesGender = genderFilter === "all"
    || (genderFilter === "male" && candidate.normalizedGender === "male")
    || (genderFilter === "female" && candidate.normalizedGender === "female")
    || (genderFilter === "other" && candidate.normalizedGender === "other")
    || (genderFilter === "unknown" && candidate.normalizedGender === "unknown");

  let matchesAge = true;
  if (ageFilter === "under40") {
    matchesAge = candidateAge !== null && candidateAge < 40;
  } else if (ageFilter === "40to60") {
    matchesAge = candidateAge !== null && candidateAge >= 40 && candidateAge <= 60;
  } else if (ageFilter === "over60") {
    matchesAge = candidateAge !== null && candidateAge > 60;
  } else if (ageFilter === "unknown") {
    matchesAge = candidateAge === null;
  }

  return matchesSearch && matchesStatus && matchesGender && matchesAge;
}
