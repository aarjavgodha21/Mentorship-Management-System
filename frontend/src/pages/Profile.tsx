import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

interface ProfileFormData {
  department: string;
  bio: string;
  skills: string; // This will be the comma-separated string from the form
  experience: string;
  availability: {
    startTime: string;
    endTime: string;
    days: string[];
  } | null; // Changed to structured object
}

interface NameFormData {
  name: string;
}

const Profile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false); // New state for profile edit mode
  const [profileData, setProfileData] = useState<ProfileFormData>({
    department: '',
    bio: '',
    skills: '',
    experience: '',
    availability: null // Initialize as null or empty object matching structure
  });
  // New state variables for availability inputs
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [availableStartTime, setAvailableStartTime] = useState<string>('');
  const [availableEndTime, setAvailableEndTime] = useState<string>('');

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfile
  } = useForm<ProfileFormData>();

  const {
    register: registerName,
    handleSubmit: handleNameSubmit,
    formState: { errors: nameErrors },
    reset: resetName
  } = useForm<NameFormData>();

  const fetchProfile = useCallback(async () => {
    try {
      if (!user || !user.id) {
        console.warn('Profile.tsx: User or User ID not available for fetching profile.');
        setLoading(false);
        return;
      }
      const response = await fetch(`http://localhost:5000/api/profile/${user.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch profile');
      const responseData = await response.json();
      const profileBackend = responseData.data.profile;

      // Transform skills array to comma-separated string for the form
      const skillsString = Array.isArray(profileBackend.skills)
        ? profileBackend.skills.map((skill: any) => skill.name).join(', ')
        : '';

      // Ensure availability is always a string for display
      let parsedAvailability = null;
      console.log('Profile.tsx - Availability Debug: Raw availability from backend:', profileBackend.availability);
      if (profileBackend.availability) {
        parsedAvailability = profileBackend.availability;
        console.log('Profile.tsx - Availability Debug: Used raw availability directly as object:', parsedAvailability);
      }

      setAvailableDays(parsedAvailability?.days || []);
      setAvailableStartTime(parsedAvailability?.startTime || '');
      setAvailableEndTime(parsedAvailability?.endTime || '');

      const transformedProfileData: ProfileFormData = {
        department: profileBackend.department || '',
        bio: profileBackend.bio || '',
        skills: skillsString,
        experience: profileBackend.experience || '',
        availability: parsedAvailability, // Directly use the parsed object
      };

      setProfileData(transformedProfileData);
      resetProfile(transformedProfileData);
      setIsEditingProfile(false); // Start in view mode
    } catch (error) {
      toast.error('Failed to load profile');
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }, [user, resetProfile]); // Add user and resetProfile to dependencies

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [user, fetchProfile]); // Add fetchProfile to dependencies

  const onProfileSubmit = async (formData: ProfileFormData) => {
    try {
      if (!user || !user.name) {
        toast.error('User information not available for profile update.');
        return;
      }

      // Split user's name into firstName and lastName
      const [firstName, ...lastNameParts] = user.name.split(' ');
      const lastName = lastNameParts.join(' ');

      // Transform skills string to array of objects for backend
      const formattedSkills = formData.skills
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0)
        .map(skillName => ({ name: skillName, proficiencyLevel: 'intermediate' }));

      // Send availability as a JavaScript object
      const dataToSend = {
        firstName: firstName || '',
        lastName: lastName || '',
        department: formData.department,
        bio: formData.bio,
        skills: formattedSkills,
        experience: formData.experience,
        availability: {
          days: availableDays,
          startTime: availableStartTime,
          endTime: availableEndTime,
        }, // Send as an object
        // hourlyRate is optional and not directly on the form, so omit if not present or handled
      };

      const response = await fetch('http://localhost:5000/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(dataToSend)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }
      toast.success('Profile updated successfully');
      await refreshUser();
      await fetchProfile(); // Re-fetch profile data to update display
      setIsEditingProfile(false); // Switch back to view mode after saving
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
      console.error('Error updating profile:', error);
    }
  };

  const onNameSubmit = async (data: NameFormData) => {
    try {
      const response = await fetch('http://localhost:5000/api/users/name', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error('Failed to update name');
      await refreshUser();
      toast.success('Name updated successfully');
      setIsEditingName(false);
    } catch (error) {
      toast.error('Failed to update name');
      console.error('Error updating name:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Profile Settings</h2>
            <p className="mt-1 text-sm text-gray-600">Manage your account settings and preferences</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Account Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  {isEditingName ? (
                    <form onSubmit={handleNameSubmit(onNameSubmit)} className="mt-1">
                      <input
                        {...registerName('name', {
                          required: 'Name is required',
                          minLength: {
                            value: 2,
                            message: 'Name must be at least 2 characters'
                          }
                        })}
                        type="text"
                        defaultValue={user?.name}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                      {nameErrors.name && (
                        <p className="mt-1 text-sm text-red-600">{nameErrors.name.message}</p>
                      )}
                      <div className="mt-2 flex space-x-2">
                        <button
                          type="submit"
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingName(false)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-sm text-gray-900">{user?.name}</p>
                      <button
                        onClick={() => setIsEditingName(true)}
                        className="text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors duration-200"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
              {isEditingProfile ? (
                <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
                  <div>
                    <label htmlFor="department" className="block text-sm font-medium text-gray-700">Department</label>
                    <input
                      type="text"
                      id="department"
                      {...registerProfile('department')}
                      defaultValue={profileData.department}
                      className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      readOnly={!isEditingProfile}
                    />
                  </div>

                  <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Bio</label>
                    <textarea
                      id="bio"
                      rows={3}
                      {...registerProfile('bio')}
                      defaultValue={profileData.bio}
                      className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      readOnly={!isEditingProfile}
                    ></textarea>
                  </div>

                  <div>
                    <label htmlFor="skills" className="block text-sm font-medium text-gray-700">Skills (comma-separated)</label>
                    <input
                      type="text"
                      id="skills"
                      {...registerProfile('skills')}
                      defaultValue={profileData.skills}
                      className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      readOnly={!isEditingProfile}
                    />
                  </div>

                  <div>
                    <label htmlFor="experience" className="block text-sm font-medium text-gray-700">Experience</label>
                    <textarea
                      id="experience"
                      rows={3}
                      {...registerProfile('experience')}
                      defaultValue={profileData.experience}
                      className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      readOnly={!isEditingProfile}
                    ></textarea>
                  </div>

                  {/* Availability - New Fields */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-900">Set Your Availability</h4>
                    <div>
                      <label htmlFor="availableDays" className="block text-sm font-medium text-gray-700">Available Days</label>
                      <select
                        id="availableDays"
                        multiple={true}
                        value={availableDays}
                        onChange={(e) => setAvailableDays(Array.from(e.target.selectedOptions, option => option.value))}
                        className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        disabled={!isEditingProfile}
                      >
                        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="availableStartTime" className="block text-sm font-medium text-gray-700">Start Time</label>
                      <input
                        type="time"
                        id="availableStartTime"
                        value={availableStartTime}
                        onChange={(e) => setAvailableStartTime(e.target.value)}
                        className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        readOnly={!isEditingProfile}
                      />
                    </div>
                    <div>
                      <label htmlFor="availableEndTime" className="block text-sm font-medium text-gray-700">End Time</label>
                      <input
                        type="time"
                        id="availableEndTime"
                        value={availableEndTime}
                        onChange={(e) => setAvailableEndTime(e.target.value)}
                        className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        readOnly={!isEditingProfile}
                      />
                    </div>
                  </div>

                  {isEditingProfile && (
                    <div className="mt-6 flex space-x-3">
                      <button
                        type="submit"
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingProfile(false);
                          resetProfile(profileData); // Reset form to current profile data on cancel
                          setAvailableDays(profileData.availability?.days || []);
                          setAvailableStartTime(profileData.availability?.startTime || '');
                          setAvailableEndTime(profileData.availability?.endTime || '');
                        }}
                        className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-md font-medium text-gray-900">Department:</h4>
                    <p className="text-gray-700">{profileData.department}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-md font-medium text-gray-900">Bio:</h4>
                    <p className="text-gray-700">{profileData.bio}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-md font-medium text-gray-900">Skills:</h4>
                    <p className="text-gray-700">{profileData.skills}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-md font-medium text-gray-900">Experience:</h4>
                    <p className="text-gray-700">{profileData.experience}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-md font-medium text-gray-900">Availability:</h4>
                    <div className="text-gray-700">
                      {(() => {
                        console.log('Profile.tsx - Availability Display Debug: profileData.availability', profileData.availability);
                        if (profileData.availability) {
                          console.log('Profile.tsx - Availability Display Debug: profileData.availability.days', profileData.availability.days);
                          return (
                            <>
                              <p>Days: {Array.isArray(profileData.availability.days) && profileData.availability.days.length > 0
                                ? profileData.availability.days.join(', ')
                                : 'Not specified'}
                              </p>
                              <p>Time: {profileData.availability.startTime && profileData.availability.endTime
                                ? `${profileData.availability.startTime} - ${profileData.availability.endTime}`
                                : 'Not specified'}
                              </p>
                            </>
                          );
                        } else {
                          return <p>Not available</p>;
                        }
                      })()}
                    </div>
                  </div>
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Edit Profile
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;