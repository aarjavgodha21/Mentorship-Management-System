import React, { useState } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import MentorSelection from '../components/MentorSelection';
import { MentorProfile, Session } from '../types';
import Select from 'react-select';

const MentorSearch: React.FC = () => {
  const { user } = useAuth();
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [searchDepartment, setSearchDepartment] = useState('');
  const [searchResults, setSearchResults] = useState<MentorProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);

  React.useEffect(() => {
    // Fetch available skills when component mounts
    const fetchSkills = async () => {
      try {
        console.log('Fetching skills from /profile/skills');
        const response = await api.get('/profile/skills');
        console.log('Skills response:', response.data);
        
        if (!response.data?.data?.skills) {
          console.error('Invalid skills response format:', response.data);
          toast.error('Invalid response format from server');
          return;
        }

        const skills = response.data.data.skills.map((skill: any) => {
          if (!skill.name) {
            console.warn('Skill missing name:', skill);
            return null;
          }
          return skill.name;
        }).filter(Boolean);

        console.log('Processed skills:', skills);
        setAvailableSkills(skills);
      } catch (error: any) {
        console.error('Error fetching skills:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        toast.error(error.response?.data?.message || 'Failed to load available skills');
      }
    };
    fetchSkills();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await api.get('/profile/search/mentors', {
        params: {
          skills: selectedSkills,
          department: searchDepartment,
        },
      });
      const formattedMentors = response.data.data.mentors.map((mentor: any) => ({
        id: mentor.id,
        userId: mentor.user_id,
        firstName: mentor.first_name,
        lastName: mentor.last_name,
        name: `${mentor.first_name} ${mentor.last_name}`,
        department: mentor.department,
        bio: mentor.bio,
        experience: mentor.experience,
        hourlyRate: mentor.hourly_rate !== null ? parseFloat(mentor.hourly_rate) : 0,
        availability: mentor.availability,
        skills: Array.isArray(mentor.skills) ? mentor.skills : [],
        averageRating: mentor.average_rating,
      }));
      setSearchResults(formattedMentors);
    } catch (error: any) {
      console.error('Error searching mentors:', error);
      toast.error(error.response?.data?.message || 'Failed to search mentors');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMentorshipRequest = async (mentorId: string) => {
    try {
      setLoading(true);
      await api.post('/mentorship/requests', {
        mentorId,
        message: 'I am interested in mentorship. Can we connect?', // Default message
      });
      toast.success('Mentorship request sent successfully!');
      // Optionally, refresh search results or update UI to reflect sent request
    } catch (error: any) {
      console.error('Error sending mentorship request:', error);
      toast.error(error.response?.data?.message || 'Failed to send mentorship request');
    } finally {
      setLoading(false);
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
              <label htmlFor="skills" className="block text-sm font-medium text-gray-700">Skills</label>
              <Select
                isMulti
                id="skills"
                options={availableSkills.map(skill => ({ value: skill, label: skill }))}
                value={selectedSkills.map(skill => ({ value: skill, label: skill }))}
                onChange={(selected) => setSelectedSkills(selected ? selected.map(option => option.value) : [])}
                className="mt-1"
                placeholder="Select skills..."
                menuPortalTarget={document.body}
                styles={{
                  control: (base, state) => ({
                    ...base,
                    minHeight: '38px',
                    fontSize: '1rem',
                    borderColor: state.isFocused ? '#3B82F6' : '#D1D5DB',
                    boxShadow: state.isFocused ? '0 0 0 1px #3B82F6' : 'none',
                    '&:hover': {
                      borderColor: state.isFocused ? '#3B82F6' : '#9CA3AF',
                    },
                    padding: '0 12px',
                    display: 'flex',
                    alignItems: 'center',
                    boxSizing: 'border-box',
                    cursor: 'text',
                  }),
                  valueContainer: (base) => ({
                    ...base,
                    padding: '4px 0',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    flex: 1,
                    overflow: 'hidden',
                    height: '100%',
                    boxSizing: 'border-box',
                    minHeight: 'auto',
                  }),
                  placeholder: (base) => ({
                    ...base,
                    color: '#6B7280',
                    fontSize: '1rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    margin: '0',
                    padding: '0',
                    lineHeight: '1.5',
                  }),
                  input: (base) => ({
                    ...base,
                    margin: '0',
                    padding: '0',
                    height: 'auto',
                    lineHeight: '1.5',
                    flex: 1,
                    minWidth: '75px',
                    minHeight: '24px',
                  }),
                  option: (base, { isFocused, isSelected }) => ({
                    ...base,
                    fontSize: '1rem',
                    padding: '10px 12px',
                    backgroundColor: isSelected
                      ? '#3B82F6'
                      : isFocused
                      ? '#EFF6FF'
                      : null,
                    color: isSelected
                      ? 'white'
                      : '#1F2937',
                    cursor: 'pointer',
                  }),
                  multiValue: (base) => ({
                    ...base,
                    backgroundColor: '#DBEAFE',
                    color: '#1E40AF',
                    borderRadius: '9999px',
                    padding: '4px 8px',
                    margin: '2px',
                    fontSize: '0.9rem',
                    lineHeight: '1.2',
                  }),
                  multiValueLabel: (base) => ({
                    ...base,
                    color: '#1E40AF',
                    padding: '0 4px',
                  }),
                  multiValueRemove: (base) => ({
                    ...base,
                    color: '#1E40AF',
                    '&:hover': {
                      backgroundColor: '#BFDBFE',
                      color: '#1E40AF',
                    },
                  }),
                  menuList: (base) => ({
                    ...base,
                    maxHeight: '200px',
                    overflowY: 'auto',
                    padding: '0',
                  }),
                  menuPortal: (base) => ({
                    ...base,
                    zIndex: 9999,
                  }),
                }}
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
          </div>
          
          <div className="mt-4">
            <button
              onClick={handleSearch}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {loading ? 'Searching...' : 'Search Mentors'}
            </button>
          </div>
        </div>

        {/* Removed immediate session booking form */}
        {searchResults.length > 0 && !loading ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {searchResults.map((mentor) => (
                <li key={mentor.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-primary-600 truncate">
                          {mentor.firstName} {mentor.lastName}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Department: {mentor.department}
                        </p>
                        {mentor.averageRating !== null && (
                          <p className="mt-1 text-sm text-gray-500">
                            Average Rating: {mentor.averageRating} / 5
                          </p>
                        )}
                        <div className="mt-2">
                          <p className="text-sm text-gray-900">Skills:</p>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {mentor.skills.map((skill, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                              >
                                {skill.name} ({skill.proficiency_level})
                              </span>
                            ))}
                          </div>
                        </div>
                        {mentor.bio && (
                          <p className="mt-2 text-sm text-gray-500">{mentor.bio}</p>
                        )}
                        {mentor.experience && (
                          <p className="mt-2 text-sm text-gray-500">
                            Experience: {mentor.experience}
                          </p>
                        )}
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <button
                          onClick={() => handleSendMentorshipRequest(mentor.userId)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          Send Mentorship Request
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            {loading ? (
              <div className="py-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 inline-block"></div>
                <p className="mt-4 text-gray-600">Loading mentors...</p>
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900">No mentors found</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Try adjusting your search filters or check back later.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorSearch; 