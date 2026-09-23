import { requestJson } from "./client";

// Data-platform routes are proxied through myBackend's authenticated
// `/data` prefix (see myBackend/src/proxy). Previously the frontend talked
// to the experiment-api service directly, bypassing the backend's
// authentication entirely - this keeps every data call authenticated and
// routed through a single backend, matching the project's architecture.
const DATA_PREFIX = "/data";

export const experimentApi = {
  createExperiment: (payload) =>
    requestJson(`${DATA_PREFIX}/experiments`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getExperiment: (experimentId) =>
    requestJson(`${DATA_PREFIX}/experiments/${experimentId}`),

  listExperiments: (page = 1, pageSize = 100) =>
    requestJson(`${DATA_PREFIX}/experiments?page=${page}&pageSize=${pageSize}`),

  updateExperiment: (experimentId, payload) =>
    requestJson(`${DATA_PREFIX}/experiments/${experimentId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  deleteExperiment: (experimentId) =>
    requestJson(`${DATA_PREFIX}/experiments/${experimentId}`, {
      method: "DELETE",
    }),

  createExercise: (experimentId, payload) =>
    requestJson(`${DATA_PREFIX}/experiments/${experimentId}/exercises`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  listExercises: (experimentId) =>
    requestJson(`${DATA_PREFIX}/experiments/${experimentId}/exercises`),

  startRecording: (exerciseId) =>
    requestJson(`${DATA_PREFIX}/exercises/${exerciseId}/recording/start`, {
      method: "POST",
    }),

  stopRecording: (exerciseId) =>
    requestJson(`${DATA_PREFIX}/exercises/${exerciseId}/recording/stop`, {
      method: "POST",
    }),

  clearExerciseData: (exerciseId) =>
    requestJson(`${DATA_PREFIX}/exercises/${exerciseId}/data`, {
      method: "DELETE",
    }),

  deleteExercise: (exerciseId) =>
    requestJson(`${DATA_PREFIX}/exercises/${exerciseId}`, {
      method: "DELETE",
    }),

  getExerciseData: (exerciseId) =>
    requestJson(`${DATA_PREFIX}/exercises/${exerciseId}/data`),
};
