export type FaceInsightMode = 'traditional' | 'state';
export type ImageSource = 'camera' | 'library';
export type FaceInsightStatus =
  'idle' | 'uploading' | 'analyzing' | 'success' | 'error';

export interface TraditionalResult {
  overallImpression: string;
  personalityTraits: string[];
  relationshipStyle: string;
  careerTendency: string;
  faceEnergySummary: string;
}

export interface StateResult {
  moodSignal: string;
  stressIndicator: string;
  fatigueSignal: string;
  emotionalTone: string;
  selfCareTip: string;
}

export interface FaceInsightSession {
  sessionId: string;
  mode: FaceInsightMode;
  imageUrl: string;
  locale: string;
  status: string;
  result: TraditionalResult | StateResult | null;
  createdAt: string;
}
