export type WorkoutSet = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  weight: number;
  reps: number;
  done: boolean;
};

export type WorkoutExercise = {
  id: string;
  name: string;
  muscleGroup: string;
};

export type WorkoutSummary = {
  startedAt: number;
  finishedAt: number;
  durationSeconds: number;
  totalVolumeKg: number;
  totalDoneSets: number;
  sets: WorkoutSet[];
};

export type WorkoutDoc = WorkoutSummary & {
  id: string;
  title: string;
  description?: string;
  createdAt?: Date | null;
};