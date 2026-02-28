export interface Survey {
  id: string;
  seminarId: string;
  seminar?: {
    id: string;
    title: string;
    startAt: string;
    type: string;
    speaker?: { name: string } | null;
  };
  title: string;
  isActive: boolean;
  _count?: {
    responses: number;
  };
  responses?: SurveyResponse[];
  createdAt: string;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  userId: string;
  user?: {
    id: string;
    name: string | null;
  };
  overallRating: number;
  contentRating: number;
  networkingRating: number;
  applicabilityRating: number;
  npsScore: number;
  freeComment?: string | null;
  createdAt: string;
}

export interface SurveyFormData {
  overallRating: number;
  contentRating: number;
  networkingRating: number;
  applicabilityRating: number;
  npsScore: number;
  freeComment?: string;
}

export interface SurveyStats {
  totalResponses: number;
  averages: {
    overall: number;
    content: number;
    networking: number;
    applicability: number;
  };
  nps: {
    score: number;
    promoters: number;
    passives: number;
    detractors: number;
  };
  distribution: {
    overall: number[];
    content: number[];
    networking: number[];
    applicability: number[];
  };
  comments: { user: string; comment: string; createdAt: string }[];
}

export interface PendingSurvey {
  surveyId: string;
  seminarId: string;
  seminarTitle: string;
  seminarDate: string;
  surveyTitle: string;
}
