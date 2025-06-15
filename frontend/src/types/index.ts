export interface MentorProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  name: string;
  department: string;
  bio: string;
  experience: string;
  hourlyRate: number;
  availability: {
    startTime: string;
    endTime: string;
    days: string[];
  } | null;
  skills: { name: string; proficiency_level: string }[];
  averageRating: number | null;
  reviews: Review[];
}

export interface Mentor {
  id: string;
  name: string;
  skills: { name: string; proficiency_level: string }[];
  availability: {
    startTime: string;
    endTime: string;
    days: string[];
  } | null;
  averageRating: number | null;
}

export interface Review {
  id: string;
  sessionId: string;
  raterId: string;
  raterName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Session {
  id: string;
  mentorId: string;
  menteeId: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  rating?: number;
  feedback?: string;
  mentor: {
    id: string;
    name: string;
  };
  mentee: {
    id: string;
    name: string;
  };
}

export interface MentorshipRequest {
  id: string;
  mentorId: string;
  menteeId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  mentor: Mentor;
  mentee: {
    id: string;
    name: string | null;
  };
} 