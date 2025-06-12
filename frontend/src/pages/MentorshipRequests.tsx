import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';

interface MentorshipRequest {
  id: number;
  mentorId: number;
  menteeId: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  mentor: {
    id: number;
    name: string;
    skills: string;
  };
  mentee: {
    id: number;
    name: string;
  };
}

const MentorshipRequests: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/mentorship/requests');
      setRequests(response.data.data.requests);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load mentorship requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: number) => {
    try {
      await axios.patch(`http://localhost:5000/api/mentorship/requests/${requestId}`, { status: 'accepted' });
      toast.success('Mentorship request accepted');
      fetchRequests();
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error('Failed to accept mentorship request');
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    try {
      await axios.patch(`http://localhost:5000/api/mentorship/requests/${requestId}`, { status: 'rejected' });
      toast.success('Mentorship request rejected');
      fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject mentorship request');
    }
  };

  const handleCancelRequest = async (requestId: number) => {
    try {
      await axios.delete(`http://localhost:5000/api/mentorship/requests/${requestId}`);
      toast.success('Mentorship request cancelled');
      fetchRequests();
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast.error('Failed to cancel mentorship request');
    }
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
    if (user?.role === 'mentor') {
      return request.mentorId === user.id;
    } else {
      return request.menteeId === user?.id;
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
                              ? request.mentee.name.charAt(0)
                              : request.mentor.name.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">
                          {user?.role === 'mentor'
                            ? `Request from ${request.mentee.name}`
                            : `Request to ${request.mentor.name}`}
                        </h3>
                        <div className="mt-1">
                          <span className="text-sm text-gray-500">
                            {user?.role === 'mentor'
                              ? 'Skills: ' + request.mentor.skills
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
        </div>
      </div>
    </div>
  );
};

export default MentorshipRequests; 