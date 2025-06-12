import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';

interface Session {
  id: number;
  mentorId: number;
  menteeId: number;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes: string;
  rating?: number;
  feedback?: string;
  mentor: {
    id: number;
    name: string;
  };
  mentee: {
    id: number;
    name: string;
  };
}

const MentorshipSessions: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/mentorship/sessions');
      setSessions(response.data.data.sessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load mentorship sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSession = async (sessionId: number) => {
    try {
      await axios.patch(`http://localhost:5000/api/mentorship/sessions/${sessionId}`, { status: 'cancelled' });
      toast.success('Session cancelled successfully');
      fetchSessions();
    } catch (error) {
      console.error('Error cancelling session:', error);
      toast.error('Failed to cancel session');
    }
  };

  const handleCompleteSession = async (sessionId: number) => {
    try {
      await axios.patch(`http://localhost:5000/api/mentorship/sessions/${sessionId}`, { status: 'completed' });
      toast.success('Session marked as completed');
      fetchSessions();
    } catch (error) {
      console.error('Error completing session:', error);
      toast.error('Failed to complete session');
    }
  };

  const handleSubmitFeedback = async (sessionId: number) => {
    try {
      await axios.post(`http://localhost:5000/api/mentorship/ratings`, {
        sessionId,
        ratedId: user?.role === 'mentee' ? selectedSession?.mentorId : selectedSession?.menteeId,
        rating,
        comment: feedback,
      });
      toast.success('Feedback submitted successfully');
      setSelectedSession(null);
      setRating(0);
      setFeedback('');
      fetchSessions();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const filteredSessions = sessions.filter(session => {
    if (user?.role === 'mentor') {
      return session.mentorId === user.id;
    } else {
      return session.menteeId === user?.id;
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mentorship Sessions</h1>
          <p className="mt-2 text-sm text-gray-500">
            {user?.role === 'mentor'
              ? 'Manage your mentorship sessions'
              : 'View and manage your learning sessions'}
          </p>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredSessions.map((session) => (
              <li key={session.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-600 font-medium">
                            {user?.role === 'mentor'
                              ? session.mentee.name.charAt(0)
                              : session.mentor.name.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">
                          {user?.role === 'mentor'
                            ? `Session with ${session.mentee.name}`
                            : `Session with ${session.mentor.name}`}
                        </h3>
                        <div className="mt-1">
                          <span className="text-sm text-gray-500">
                            {new Date(session.startTime).toLocaleDateString()} at{' '}
                            {new Date(session.startTime).toLocaleTimeString()} -{' '}
                            {new Date(session.endTime).toLocaleTimeString()}
                          </span>
                        </div>
                        {session.notes && (
                          <p className="mt-1 text-sm text-gray-500">{session.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(
                          session.status
                        )}`}
                      >
                        {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                      </span>
                      {session.status === 'scheduled' && (
                        <button
                          onClick={() => handleCancelSession(session.id)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Cancel
                        </button>
                      )}
                      {session.status === 'scheduled' && user?.role === 'mentor' && (
                        <button
                          onClick={() => handleCompleteSession(session.id)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          Complete
                        </button>
                      )}
                      {session.status === 'completed' && !session.rating && user?.role === 'mentee' && (
                        <button
                          onClick={() => setSelectedSession(session)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          Provide Feedback
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {filteredSessions.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900">No sessions found</h3>
              <p className="mt-2 text-sm text-gray-500">
                {user?.role === 'mentor'
                  ? 'You have no scheduled mentorship sessions.'
                  : 'You have no scheduled learning sessions.'}
              </p>
            </div>
          )}
        </div>

        {/* Feedback Modal */}
        {selectedSession && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Provide Feedback</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rating</label>
                  <div className="mt-1 flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className={`text-2xl ${
                          star <= rating ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label htmlFor="feedback" className="block text-sm font-medium text-gray-700">
                    Feedback
                  </label>
                  <textarea
                    id="feedback"
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setSelectedSession(null)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubmitFeedback(selectedSession!.id)}
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Submit Feedback
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorshipSessions; 