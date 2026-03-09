import { supabase } from '../../../lib/supabase';
import { friendlyApiError } from '../../../lib/apiError';
import type { TraditionalResult, StateResult } from '../types';

const BUCKET = 'face-insight-uploads';

export async function uploadFaceImage(
  userId: string,
  localUri: string
): Promise<{ uploadedUrl: string }> {
  const now = new Date();
  const yyyy = now.getFullYear().toString();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const uuid = crypto.randomUUID();
  const path = `${userId}/${yyyy}/${mm}/${dd}/${uuid}.jpg`;

  let blob: Blob;
  try {
    const response = await fetch(localUri);
    blob = await response.blob();
  } catch (e) {
    throw new Error(friendlyApiError(e));
  }

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: 'image/jpeg', upsert: false });

  if (uploadError) {
    throw new Error(friendlyApiError(uploadError));
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { uploadedUrl: data.publicUrl };
}

export interface AnalyzeRequest {
  mode: 'traditional' | 'state';
  imageUrl: string;
  imageSource: 'camera' | 'library';
  locale: string;
  culturalFrame: string;
  userId: string;
}

export interface AnalyzeResponse {
  sessionId: string;
  status: string;
  result: TraditionalResult | StateResult;
}

export async function analyzeFace(req: AnalyzeRequest): Promise<AnalyzeResponse> {
  const { data, error } = await supabase.functions.invoke<AnalyzeResponse>(
    'face-insight-analyze',
    { body: req }
  );

  if (error) {
    throw new Error(friendlyApiError(error));
  }

  if (!data) {
    throw new Error(friendlyApiError(new Error('응답 데이터가 없습니다.')));
  }

  return data;
}
