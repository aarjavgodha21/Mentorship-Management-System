import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';

interface Mentor {
  id: number;
  name: string;
  bio: string;
  skills: string;
  experience: string;
  availability: string;
  hourlyRate: number;
  rating: number;
}

const FindMentors: React.FC = () => {
  const { user } = useAuth();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [maxRate, setMaxRate] = useState<number | ''>('');

  useEffect(() => {
    fetchMentors();
  }, []);

  const fetchMentors = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/profiles/mentors');
      setMentors(response.data);
    } catch (error) {
      console.error('Error fetching mentors:', error);
      toast.error('Failed to load mentors');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestMentorship = async (mentorId: number) => {
    try {
      await axios.post('http://localhost:5000/api/mentorship/requests', {
        mentorId,
        menteeId: user?.id,
      });
      toast.success('Mentorship request sent successfully');
    } catch (error) {
      console.error('Error sending mentorship request:', error);
      toast.error('Failed to send mentorship request');
    }
  };

  const filteredMentors = mentors.filter(mentor => {
    const matchesSearch = mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentor.skills.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentor.bio.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSkill = !selectedSkill || mentor.skills.toLowerCase().includes(selectedSkill.toLowerCase());
    
    const matchesRate = !maxRate || mentor.hourlyRate <= maxRate;

    return matchesSearch && matchesSkill && matchesRate;
  });

  const uniqueSkills = Array.from(new Set(mentors.flatMap(mentor => 
    mentor.skills.split(',').map(skill => skill.trim())
  )));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Find a Mentor</h1>
          <p className="mt-2 text-sm text-gray-500">
            Browse through our network of experienced mentors and find the perfect match for your learning journey.
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                Search
              </label>
              <input
                type="text"
                id="search"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder="Search by name, skills, or bio"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="skill" className="block text-sm font-medium text-gray-700">
                Filter by Skill
              </label>
              <select
                id="skill"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
              >
                <option value="">All Skills</option>
                {uniqueSkills.map((skill) => (
                  <option key={skill} value={skill}>
                    {skill}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="maxRate" className="block text-sm font-medium text-gray-700">
                Maximum Hourly Rate ($)
              </label>
              <input
                type="number"
                id="maxRate"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder="Enter maximum rate"
                value={maxRate}
                onChange={(e) => setMaxRate(e.target.value ? Number(e.target.value) : '')}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMentors.map((mentor) => (
            <div key={mentor.id} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">{mentor.name}</h3>
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="ml-1 text-sm text-gray-600">{mentor.rating.toFixed(1)}</span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-500">{mentor.bio}</p>
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900">Skills</h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {mentor.skills.split(',').map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                      >
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900">Experience</h4>
                  <p className="mt-1 text-sm text-gray-500">{mentor.experience}</p>
                </div>
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900">Availability</h4>
                  <p className="mt-1 text-sm text-gray-500">{mentor.availability}</p>
                </div>
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900">Hourly Rate</h4>
                  <p className="mt-1 text-sm text-gray-500">${mentor.hourlyRate}/hour</p>
                </div>
                <div className="mt-6">
                  <button
                    onClick={() => handleRequestMentorship(mentor.id)}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Request Mentorship
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredMentors.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900">No mentors found</h3>
            <p className="mt-2 text-sm text-gray-500">
              Try adjusting your search criteria to find more mentors.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FindMentors; 