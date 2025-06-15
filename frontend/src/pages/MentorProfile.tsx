import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { MentorProfile, Review } from '../types';

const MentorProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [mentorProfile, setMentorProfile] = useState<MentorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMentorProfile = async () => {
      try {
        const response = await api.get(`/profile/${id}`);
        setMentorProfile(response.data.data.profile);
      } catch (error: any) {
        console.error('Error fetching mentor profile:', error.response?.data || error.message || error);
        toast.error(error.response?.data?.message || 'Failed to load mentor profile');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchMentorProfile();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!mentorProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Mentor profile not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Mentor Profile: {mentorProfile.firstName} {mentorProfile.lastName}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Personal details and mentorship information.
          </p>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Department</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{mentorProfile.department}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Bio</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{mentorProfile.bio || 'N/A'}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Experience</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{mentorProfile.experience || 'N/A'}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Hourly Rate</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{mentorProfile.hourlyRate ? `$${mentorProfile.hourlyRate}/hr` : 'N/A'}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Skills</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {mentorProfile.skills && mentorProfile.skills.length > 0
                  ? mentorProfile.skills.map(s => `${s.name} (${s.proficiency_level})`).join(', ')
                  : 'N/A'}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Availability</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {mentorProfile.availability && mentorProfile.availability.days.length > 0
                  ? `${mentorProfile.availability.days.join(', ')} from ${mentorProfile.availability.startTime} to ${mentorProfile.availability.endTime}`
                  : 'Not available'}
              </dd>
            </div>

            {/* Rating and Reviews Section */}
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Average Rating</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {mentorProfile.averageRating ? `${mentorProfile.averageRating} / 5` : 'No ratings yet'}
              </dd>
            </div>

            <div className="bg-white px-4 py-5 sm:px-6">
              <h4 className="text-md leading-6 font-medium text-gray-900">Reviews</h4>
              {mentorProfile.reviews && mentorProfile.reviews.length > 0 ? (
                <ul className="mt-4 space-y-4">
                  {mentorProfile.reviews.map((review: Review) => (
                    <li key={review.id} className="border p-4 rounded-md">
                      <div className="flex items-center mb-2">
                        <div className="text-yellow-400 text-lg mr-1">{'★'.repeat(review.rating)}</div>
                        <div className="text-gray-600 text-sm">({review.rating}/5)</div>
                      </div>
                      <p className="text-gray-800 text-sm">{review.comment}</p>
                      <p className="text-gray-500 text-xs mt-1">
                        by {review.raterName} on {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-gray-500">No reviews yet.</p>
              )}
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};

export default MentorProfilePage; 