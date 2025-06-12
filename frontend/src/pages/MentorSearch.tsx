import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';

interface MentorProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  department: string;
  bio: string;
  experience: string;
  hourlyRate: number;
  availability: any;
  skills: { name: string; proficiency_level: string }[];
}

const MentorSearch: React.FC = () => {
  const { user } = useAuth();
  const [searchSkill, setSearchSkill] = useState('');
  const [searchDepartment, setSearchDepartment] = useState('');
  const [searchResults, setSearchResults] = useState<MentorProfile[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/profile/search/mentors', {
        params: {
          skill: searchSkill,
          department: searchDepartment,
        },
      });
      const formattedMentors = response.data.data.mentors.map((mentor: any) => ({
        id: mentor.id,
        userId: mentor.user_id,
        firstName: mentor.first_name,
        lastName: mentor.last_name,
        department: mentor.department,
        bio: mentor.bio,
        experience: mentor.experience,
        hourlyRate: mentor.hourly_rate !== null ? parseFloat(mentor.hourly_rate) : 0,
        availability: mentor.availability,
        skills: Array.isArray(mentor.skills) ? mentor.skills : [],
      }));
      setSearchResults(formattedMentors);
      console.log('handleSearch: Formatted mentors for state:', formattedMentors);
    } catch (error: any) {
      console.error('Error searching mentors:', error);
      toast.error(error.response?.data?.message || 'Failed to search mentors');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestMentorship = async (mentorId: string, mentorName: string) => {
    if (!user) {
      toast.error('Please log in to request mentorship.');
      return;
    }
    if (user.role !== 'mentee') {
      toast.error('Only mentees can request mentorship.');
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/mentorship/requests', {
        mentorId: mentorId,
        message: `Hello ${mentorName}, I am interested in mentorship.` // Optional message
      });
      toast.success(`Mentorship request sent to ${mentorName}`);
    } catch (error: any) {
      console.error('Error sending mentorship request:', error);
      toast.error(error.response?.data?.message || 'Failed to send mentorship request');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Find Mentors</h1>
          <p className="mt-2 text-sm text-gray-500">
            Search for mentors based on their skills, department, and other criteria.
          </p>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 mb-8">
          <h2 className="text-xl font-medium text-gray-900 mb-4">Search Filters</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label htmlFor="skill" className="block text-sm font-medium text-gray-700">Skill</label>
              <input
                type="text"
                id="skill"
                className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                value={searchSkill}
                onChange={(e) => setSearchSkill(e.target.value)}
                placeholder="e.g., React, Python"
              />
            </div>
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700">Department</label>
              <input
                type="text"
                id="department"
                className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                value={searchDepartment}
                onChange={(e) => setSearchDepartment(e.target.value)}
                placeholder="e.g., Computer Science"
              />
            </div>
            {/* Additional filters like rating can be added here */}
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSearch}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {loading ? 'Searching...' : 'Search Mentors'}
            </button>
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {loading ? (
            <div className="py-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 inline-block"></div>
              <p className="mt-4 text-gray-600">Loading mentors...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {searchResults.map((mentor) => (
                <li key={mentor.id}>
                  <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                    <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                      <div className="truncate">
                        <div className="flex text-sm">
                          <p className="font-medium text-primary-600 truncate">{mentor.firstName} {mentor.lastName}</p>
                          <p className="ml-1 flex-shrink-0 font-normal text-gray-500">@{mentor.department}</p>
                        </div>
                        <div className="mt-2 flex">
                          <div className="flex items-center text-sm text-gray-500">
                            <p className="text-gray-900 font-medium">Skills:</p> {mentor.skills.map(s => s.name).join(', ')}
                          </div>
                        </div>
                        {mentor.bio && (
                          <p className="text-sm text-gray-500 mt-1">{mentor.bio}</p>
                        )}
                        {mentor.experience && (
                          <p className="text-sm text-gray-500 mt-1">Experience: {mentor.experience}</p>
                        )}
                      </div>
                    </div>
                    <div className="ml-5 flex-shrink-0">
                      <button
                        onClick={() => handleRequestMentorship(mentor.userId, `${mentor.firstName} ${mentor.lastName}`)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        Request Mentorship
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (user?.role === 'mentee' && !loading && searchResults.length === 0) ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900">No mentors found</h3>
              <p className="mt-2 text-sm text-gray-500">
                Try adjusting your search filters or check back later.
              </p>
            </div>
          ) : !loading && searchResults.length === 0 && user?.role === 'mentor' && (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900">Mentors are for mentees!</h3>
              <p className="mt-2 text-sm text-gray-500">
                Switch to a mentee account to search for mentors.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MentorSearch; 