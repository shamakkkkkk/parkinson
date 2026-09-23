'use strict';

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '127.0.0.1';
const SPEC_PATH = path.join(__dirname, 'openapi.yaml');
const STORE_PATH = path.join(__dirname, 'data-store.json');

// ---------------------------------------------------------------------------
// In-memory storage (stub). Replaced by a real database later.
// ---------------------------------------------------------------------------
const experiments = new Map(); // id -> experiment
const exercises = new Map(); // id -> exercise
const exerciseData = new Map(); // exerciseId -> ExerciseData

function loadStore() {
  try {
    if (!fs.existsSync(STORE_PATH)) {
      return;
    }

    const raw = fs.readFileSync(STORE_PATH, 'utf8');
    if (!raw.trim()) {
      return;
    }

    const parsed = JSON.parse(raw);
    for (const [id, experiment] of parsed.experiments || []) {
      // Normalize candidate/patient number for backward compatibility
      if (experiment.candidateNumber && !experiment.patientNumber) {
        experiment.patientNumber = experiment.candidateNumber;
      }
      if (experiment.patientNumber && !experiment.candidateNumber) {
        experiment.candidateNumber = experiment.patientNumber;
      }
      experiments.set(id, experiment);
    }
    for (const [id, exercise] of parsed.exercises || []) {
      exercises.set(id, exercise);
    }
    for (const [id, data] of parsed.exerciseData || []) {
      exerciseData.set(id, data);
    }
  } catch (error) {
    console.warn('Failed to load persisted API store, starting empty:', error.message);
  }
}

function saveStore() {
  const payload = {
    experiments: [...experiments.entries()],
    exercises: [...exercises.entries()],
    exerciseData: [...exerciseData.entries()],
  };

  fs.writeFileSync(STORE_PATH, JSON.stringify(payload, null, 2));
}

loadStore();

const now = () => new Date().toISOString();
const id = () => crypto.randomUUID();

function paginate(items, query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize, 10) || 20));
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page,
    pageSize,
    total: items.length,
  };
}

// Generate plausible stub sensor data so GET /data returns something useful.
function generateData(exerciseId, startedAt, endedAt) {
  const n = 200;
  const rand = (min, max) => min + Math.random() * (max - min);

  const mouth = Array.from({ length: n }, () => [
    +rand(0.0, 0.3).toFixed(4),
    +rand(0.0, 0.5).toFixed(4),
  ]);
  const sound = Array.from({ length: n }, () => +rand(40, 85).toFixed(2)); // dB
  const speed = Array.from({ length: n }, () => +rand(0, 180).toFixed(2)); // cm/s
  const steps = Array.from({ length: 15 }, () => +rand(30, 80).toFixed(1)); // cm

  const avg = (a) => a.reduce((s, v) => s + v, 0) / a.length;
  const median = (a) => {
    const s = [...a].sort((x, y) => x - y);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };

  return {
    exerciseId,
    startedAt,
    endedAt,
    mouthOpening: { values: mouth, sampleRate: 30 },
    soundPressure: { values: sound, sampleRate: 48000, unit: 'dB' },
    footSpeed: { values: speed, sampleRate: 100, unit: 'cm/s' },
    aggregates: {
      stepLengths: { values: steps, unit: 'cm' },
      averages: {
        mouthOpeningVertical: +avg(mouth.map((t) => t[0])).toFixed(4),
        mouthOpeningHorizontal: +avg(mouth.map((t) => t[1])).toFixed(4),
        soundPressure: +avg(sound).toFixed(2),
        footSpeed: +avg(speed).toFixed(2),
        stepLength: +avg(steps).toFixed(2),
      },
      medians: {
        mouthOpeningVertical: +median(mouth.map((t) => t[0])).toFixed(4),
        mouthOpeningHorizontal: +median(mouth.map((t) => t[1])).toFixed(4),
        soundPressure: +median(sound).toFixed(2),
        footSpeed: +median(speed).toFixed(2),
        stepLength: +median(steps).toFixed(2),
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Health + Documentation
// ---------------------------------------------------------------------------
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/openapi.yaml', (_req, res) => {
  res.type('text/yaml').sendFile(SPEC_PATH);
});

app.get(['/', '/docs'], (_req, res) => {
  // Scalar API Reference: Redoc-like docs with a built-in, working "Try it" console.
  res.type('html').send(`<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Experiment API — Documentation</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>body { margin: 0; padding: 0; }</style>
  </head>
  <body>
    <script
      id="api-reference"
      data-url="/openapi.yaml"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`);
});

// ---------------------------------------------------------------------------
// Experiments
// ---------------------------------------------------------------------------
app.post('/experiments', (req, res) => {
  const body = req.body || {};
  const canonicalNumber = body.patientNumber ?? body.candidateNumber ?? null;
  const experiment = {
    id: id(),
    patientNumber: canonicalNumber,
    candidateNumber: canonicalNumber,
    height: body.height ?? null,
    age: body.age ?? null,
    weight: body.weight ?? null,
    createdAt: now(),
    properties: body.properties ?? {},
  };
  experiments.set(experiment.id, experiment);
  saveStore();
  res.status(201).json(experiment);
});

app.get('/experiments', (req, res) => {
  res.json(paginate([...experiments.values()], req.query));
});

app.get('/experiments/:experimentId', (req, res) => {
  const experiment = experiments.get(req.params.experimentId);
  if (!experiment) return res.status(404).json({ error: 'Experiment not found' });
  res.json(experiment);
});

app.patch('/experiments/:experimentId', (req, res) => {
  const experiment = experiments.get(req.params.experimentId);
  if (!experiment) return res.status(404).json({ error: 'Experiment not found' });
  const body = req.body || {};
  for (const key of ['patientNumber', 'candidateNumber', 'height', 'age', 'weight', 'properties']) {
    if (key in body) {
      // keep both fields in sync when candidateNumber/patientNumber is provided
      if (key === 'candidateNumber' || key === 'patientNumber') {
        const val = body[key];
        experiment.patientNumber = val;
        experiment.candidateNumber = val;
      } else {
        experiment[key] = body[key];
      }
    }
  }
  saveStore();
  res.json(experiment);
});

app.delete('/experiments/:experimentId', (req, res) => {
  const experiment = experiments.get(req.params.experimentId);
  if (!experiment) return res.status(404).json({ error: 'Experiment not found' });
  // Cascade delete: exercises and their data.
  for (const [exId, ex] of exercises) {
    if (ex.experimentId === experiment.id) {
      exercises.delete(exId);
      exerciseData.delete(exId);
    }
  }
  experiments.delete(experiment.id);
  saveStore();
  res.status(204).end();
});

// ---------------------------------------------------------------------------
// Exercises
// ---------------------------------------------------------------------------
app.post('/experiments/:experimentId/exercises', (req, res) => {
  const experiment = experiments.get(req.params.experimentId);
  if (!experiment) return res.status(404).json({ error: 'Experiment not found' });
  const body = req.body || {};
  const exercise = {
    id: id(),
    experimentId: experiment.id,
    createdAt: now(),
    recordingStatus: 'idle',
    hasData: false,
    recordingStartedAt: null,
    recordingEndedAt: null,
    properties: body.properties ?? {},
  };
  exercises.set(exercise.id, exercise);
  saveStore();
  res.status(201).json(exercise);
});

app.get('/experiments/:experimentId/exercises', (req, res) => {
  const experiment = experiments.get(req.params.experimentId);
  if (!experiment) return res.status(404).json({ error: 'Experiment not found' });
  res.json([...exercises.values()].filter((ex) => ex.experimentId === experiment.id));
});

app.get('/exercises', (req, res) => {
  res.json(paginate([...exercises.values()], req.query));
});

app.get('/exercises/:exerciseId', (req, res) => {
  const exercise = exercises.get(req.params.exerciseId);
  if (!exercise) return res.status(404).json({ error: 'Exercise not found' });
  res.json(exercise);
});

app.delete('/exercises/:exerciseId', (req, res) => {
  const exercise = exercises.get(req.params.exerciseId);
  if (!exercise) return res.status(404).json({ error: 'Exercise not found' });
  exercises.delete(exercise.id);
  exerciseData.delete(exercise.id);
  saveStore();
  res.status(204).end();
});

// ---------------------------------------------------------------------------
// Recording control
// ---------------------------------------------------------------------------
app.post('/exercises/:exerciseId/recording/start', (req, res) => {
  const exercise = exercises.get(req.params.exerciseId);
  if (!exercise) return res.status(404).json({ error: 'Exercise not found' });
  if (exercise.hasData) {
    return res.status(409).json({ error: 'Exercise already has data. Clear it before recording again.' });
  }
  if (exercise.recordingStatus === 'recording') {
    return res.status(409).json({ error: 'Recording is already in progress.' });
  }
  exercise.recordingStatus = 'recording';
  exercise.recordingStartedAt = now();
  exercise.recordingEndedAt = null;
  saveStore();
  res.json(exercise);
});

app.post('/exercises/:exerciseId/recording/stop', (req, res) => {
  const exercise = exercises.get(req.params.exerciseId);
  if (!exercise) return res.status(404).json({ error: 'Exercise not found' });
  if (exercise.recordingStatus !== 'recording') {
    return res.status(409).json({ error: 'Exercise is not currently recording.' });
  }
  exercise.recordingStatus = 'stopped';
  exercise.recordingEndedAt = now();
  exercise.hasData = true;
  exerciseData.set(
    exercise.id,
    generateData(exercise.id, exercise.recordingStartedAt, exercise.recordingEndedAt),
  );
  saveStore();
  res.json(exercise);
});

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
app.get('/exercises/:exerciseId/data', (req, res) => {
  const exercise = exercises.get(req.params.exerciseId);
  if (!exercise) return res.status(404).json({ error: 'Exercise not found' });
  const data = exerciseData.get(exercise.id);
  if (!data) return res.status(404).json({ error: 'Exercise has no data yet' });
  res.json(data);
});

app.delete('/exercises/:exerciseId/data', (req, res) => {
  const exercise = exercises.get(req.params.exerciseId);
  if (!exercise) return res.status(404).json({ error: 'Exercise not found' });
  exerciseData.delete(exercise.id);
  exercise.hasData = false;
  exercise.recordingStatus = 'idle';
  exercise.recordingStartedAt = null;
  exercise.recordingEndedAt = null;
  saveStore();
  res.status(204).end();
});

// ---------------------------------------------------------------------------
if (require.main === module) {
  app.listen(PORT, HOST, () => {
    console.log(`Experiment API running on http://${HOST}:${PORT}`);
    console.log(`  Docs:  http://${HOST}:${PORT}/docs`);
    console.log(`  Spec:  http://${HOST}:${PORT}/openapi.yaml`);
  });
}

module.exports = app;
