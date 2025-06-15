import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import { toast } from 'react-toastify';
import MentorSelection from '../components/MentorSelection';
import { MentorshipRequest, Mentor } from '../types';

const MentorshipRequests: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedMentorForScheduling, setSelectedMentorForScheduling] = useState<Mentor | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  useEffect(() => {
    console.log('MentorshipRequests: Component mounted, user:', user);
    fetchRequests();
  }, [user]);

  const fetchRequests = async () => {
    try {
      console.log('MentorshipRequests: Fetching requests...');
      const response = await api.get('/mentorship/requests');
      console.log('MentorshipRequests: Raw response:', response.data);
      const requestsData = response.data.data.requests;
      const formattedRequests: MentorshipRequest[] = requestsData.map((request: any) => {
        console.log('Raw request.mentor.skills:', request.mentor.skills);
        console.log('Raw request.mentor.availability:', request.mentor.availability);

        let formattedMentor: Mentor | null = null;
        if (request.mentor) {
          let skillsArray: { name: string; proficiency_level: string }[] = [];
          if (request.mentor.skills) {
            if (Array.isArray(request.mentor.skills)) {
              skillsArray = request.mentor.skills;
            } else if (typeof request.mentor.skills === 'string') {
              try {
                const parsed = JSON.parse(request.mentor.skills);
                if (Array.isArray(parsed)) {
                  skillsArray = parsed;
                } else {
                  skillsArray = [{ name: request.mentor.skills, proficiency_level: "Beginner" }];
                }
              } catch (e) {
                skillsArray = [{ name: request.mentor.skills, proficiency_level: "Beginner" }];
              }
            }
          }

          let availabilityObject: { startTime: string; endTime: string; days: string[] } | null = null;
          if (request.mentor.availability) {
            if (typeof request.mentor.availability === 'string') {
              try {
                availabilityObject = JSON.parse(request.mentor.availability);
              } catch (e) {
                console.warn('Failed to parse availability string:', request.mentor.availability, e);
              }
            } else if (typeof request.mentor.availability === 'object') {
              availabilityObject = request.mentor.availability;
            }
          }

          formattedMentor = {
            id: request.mentor.id,
            name: request.mentor.name || '',
            skills: skillsArray,
            availability: availabilityObject,
            averageRating: null,
          };
        }

        let formattedMentee = {
          id: request.mentee.id,
          name: request.mentee.name || '',
        };
        
        return {
          id: request.id,
          mentorId: request.mentorId,
          menteeId: request.menteeId,
          status: request.status,
          createdAt: request.createdAt,
          mentor: formattedMentor,
          mentee: formattedMentee,
        };
      });
      console.log('MentorshipRequests: Processed requests:', formattedRequests);

      // Sort requests: accepted first, then pending, then rejected
      formattedRequests.sort((a, b) => {
        const statusOrder: { [key: string]: number } = {
          'accepted': 1,
          'pending': 2,
          'rejected': 3,
        };
        return statusOrder[a.status] - statusOrder[b.status];
      });

      setRequests(formattedRequests);
    } catch (error: any) {
      console.error('MentorshipRequests: Error fetching requests:', error.response?.data || error.message || error);
      toast.error('Failed to load mentorship requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await api.patch(`/mentorship/requests/${requestId}`, { status: 'accepted' });
      toast.success('Mentorship request accepted');
      fetchRequests();
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error('Failed to accept mentorship request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await api.patch(`/mentorship/requests/${requestId}`, { status: 'rejected' });
      toast.success('Mentorship request rejected');
      fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject mentorship request');
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      await api.delete(`/mentorship/requests/${requestId}`);
      toast.success('Mentorship request cancelled');
      fetchRequests();
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast.error('Failed to cancel mentorship request');
    }
  };

  const handleScheduleSession = (request: MentorshipRequest) => {
    setSelectedMentorForScheduling(request.mentor);
    setSelectedRequestId(request.id);
    setShowScheduleModal(true);
  };

  const handleSessionBooked = () => {
    setShowScheduleModal(false);
    setSelectedMentorForScheduling(null);
    setSelectedRequestId(null);
    fetchRequests();
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
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

  const filteredRequests = requests.filter(request => {
    console.log('MentorshipRequests: Filtering request:', {
      request,
      userId: user?.id,
      userRole: user?.role,
      requestMenteeId: request.menteeId,
      requestMentorId: request.mentorId
    });
    
    if (user?.role === 'mentor') {
      const matches = request.mentorId === String(user.id);
      console.log('MentorshipRequests: Mentor request match:', matches);
      return matches;
    } else {
      const matches = request.menteeId === String(user?.id);
      console.log('MentorshipRequests: Mentee request match:', matches);
      return matches;
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mentorship Requests</h1>
          <p className="mt-2 text-sm text-gray-500">
            {user?.role === 'mentor'
              ? 'Manage requests from potential mentees'
              : 'Track your mentorship requests'}
          </p>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredRequests.map((request) => (
              <li key={request.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-600 font-medium">
                            {user?.role === 'mentor'
                              ? (request.mentee?.name?.charAt(0) || 'U')
                              : (request.mentor?.name?.charAt(0) || 'U')}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">
                          {user?.role === 'mentor'
                            ? `Request from ${request.mentee?.name || 'Unknown Mentee'}`
                            : `Request to ${request.mentor?.name || 'Unknown Mentor'}`}
                        </h3>
                        <div className="mt-1">
                          <span className="text-sm text-gray-500">
                            {user?.role === 'mentor'
                              ? 'Skills: ' +
                                (request.mentor?.skills && request.mentor.skills.length > 0
                                  ? request.mentor.skills.map(s => `${s.name} (${s.proficiency_level})`).join(', ')
                                  : 'N/A')
                              : 'Requested on ' + new Date(request.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(
                          request.status
                        )}`}
                      >
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                      {request.status === 'pending' && (
                        <>
                          {user?.role === 'mentor' ? (
                            <>
                              <button
                                onClick={() => handleAcceptRequest(request.id)}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleRejectRequest(request.id)}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleCancelRequest(request.id)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              Cancel
                            </button>
                          )}
                        </>
                      )}
                      {request.status === 'accepted' && user?.role === 'mentee' && (
                        <button
                          onClick={() => handleScheduleSession(request)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          Schedule Session
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {filteredRequests.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900">No requests found</h3>
              <p className="mt-2 text-sm text-gray-500">
                {user?.role === 'mentor'
                  ? 'You have no pending mentorship requests.'
                  : 'You have not made any mentorship requests yet.'}
              </p>
            </div>
          )}

          {showScheduleModal && selectedMentorForScheduling && selectedRequestId && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
              <div className="bg-white p-8 rounded-lg shadow-xl max-w-lg w-full relative">
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                <h2 className="text-2xl font-bold mb-6 text-gray-900">Schedule Session with {selectedMentorForScheduling.name}</h2>
                <MentorSelection
                  initialMentor={selectedMentorForScheduling}
                  onSessionBooked={handleSessionBooked}
                  requestId={selectedRequestId}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MentorshipRequests; 