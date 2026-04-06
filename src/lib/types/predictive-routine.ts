// ─── Predictive Routine Types ───

/** Status enum matching backend PredictiveRoutineStatus */
export enum PredictiveRoutineStatus {
  PENDING = 'PENDING',
  VIEWED = 'VIEWED',
  ACCEPTED = 'ACCEPTED',
  DISMISSED = 'DISMISSED',
  IMPLEMENTED = 'IMPLEMENTED',
  EXPIRED = 'EXPIRED',
}

/** Individual day routine structure */
export interface PredictiveRoutineDay {
  day: string;
  morning: string[];
  evening: string[];
  tip: string;
  warning: string | null;
}

/** Generated routine structure from AI */
export interface GeneratedRoutine {
  days: PredictiveRoutineDay[];
  globalAdvice: string;
}

/** Weather data structure */
export interface WeatherData {
  daily: {
    time: string[];
    uv_index_max: number[];
    precipitation_sum: number[];
    temperature_2m_max: number[];
  };
}

/** Main PredictiveRoutine model */
export interface PredictiveRoutine {
  id: string;
  userId: string;
  analysisId: string;
  generatedAt: string;
  routine: GeneratedRoutine;
  weatherData: WeatherData | null;
  expiresAt: string;
  status: PredictiveRoutineStatus;
  actionedAt: string | null;
  dismissedAt: string | null;
  implementedAt: string | null;
  feedback: string | null;
  createdAt: string;
  updatedAt: string;
}

/** DTO for generating a predictive routine */
export interface GeneratePredictiveRoutineDto {
  analysisId: string;
  analysisResult: {
    condition: string;
    detectedIssues: string[];
    skinType: string;
  };
  latitude: number;
  longitude: number;
}

/** DTO for updating routine status */
export interface UpdatePredictiveRoutineStatusDto {
  status: PredictiveRoutineStatus;
  feedback?: string;
}

/** Query params for getting user routines */
export interface GetUserRoutinesQuery {
  status?: PredictiveRoutineStatus;
  includeExpired?: boolean;
}

/** Response from validate and activate */
export interface ValidateRoutineResponse {
  success: boolean;
  predictiveRoutineId: string;
  createdRoutines: {
    morning: { id: string; name: string };
    evening: { id: string; name: string };
  };
  message: string;
}
