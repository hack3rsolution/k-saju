import { create } from 'zustand';
import type {
  FaceInsightMode,
  ImageSource,
  FaceInsightStatus,
  TraditionalResult,
  StateResult,
} from '../types';

interface FaceInsightState {
  mode: FaceInsightMode | null;
  imageSource: ImageSource | null;
  localImageUri: string | null;
  uploadedImageUrl: string | null;
  sessionId: string | null;
  status: FaceInsightStatus;
  errorMessage: string | null;
  result: TraditionalResult | StateResult | null;

  setMode: (mode: FaceInsightMode) => void;
  setImageSource: (src: ImageSource) => void;
  setLocalImageUri: (uri: string | null) => void;
  setUploadedImageUrl: (url: string | null) => void;
  setSessionId: (id: string | null) => void;
  setStatus: (status: FaceInsightStatus) => void;
  setErrorMessage: (msg: string | null) => void;
  setResult: (result: TraditionalResult | StateResult | null) => void;
  reset: () => void;
}

const initialState = {
  mode: null,
  imageSource: null,
  localImageUri: null,
  uploadedImageUrl: null,
  sessionId: null,
  status: 'idle' as FaceInsightStatus,
  errorMessage: null,
  result: null,
};

export const useFaceInsightStore = create<FaceInsightState>((set) => ({
  ...initialState,
  setMode: (mode) => set({ mode }),
  setImageSource: (imageSource) => set({ imageSource }),
  setLocalImageUri: (localImageUri) => set({ localImageUri }),
  setUploadedImageUrl: (uploadedImageUrl) => set({ uploadedImageUrl }),
  setSessionId: (sessionId) => set({ sessionId }),
  setStatus: (status) => set({ status }),
  setErrorMessage: (errorMessage) => set({ errorMessage }),
  setResult: (result) => set({ result }),
  reset: () => set(initialState),
}));
