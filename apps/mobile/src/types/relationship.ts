export type RelationshipType = 'romantic' | 'friend' | 'family' | 'colleague' | 'other';
export type CompatibilityStatus = 'good' | 'neutral' | 'caution';

export interface Relationship {
  id: string;
  ownerId: string;
  name: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour?: number;
  gender: 'M' | 'F';
  relationshipType: RelationshipType;
  compatibilityScore?: number;
  compatibilityStatus?: CompatibilityStatus;
  compatibilityCachedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RelationshipFortuneData {
  compatibilityScore: number;
  compatibilityStatus: CompatibilityStatus;
  summary: string;
  monthlyFlow: string;
  strengths: string[];
  cautions: string[];
  elementSynergy: Record<string, number>;
}

export interface AddRelationshipInput {
  name: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour?: number;
  gender: 'M' | 'F';
  relationshipType: RelationshipType;
}
