import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  department: string;
  bio: string;
  skills: string;
  experience: string;
  availability: string;
  hourlyRate?: number;
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileFormData>();
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`http://localhost:5000/api/profile/${user?.id}`);
        const fetchedProfile = response.data.data.profile;
        setProfile(fetchedProfile);
        reset({
          ...fetchedProfile,
          skills: Array.isArray(fetchedProfile.skills) ? fetchedProfile.skills.map((s: any) => s.name).join(', ') : '',
          availability: fetchedProfile.availability && typeof fetchedProfile.availability === 'object' && fetchedProfile.availability.text ? fetchedProfile.availability.text : fetchedProfile.availability || '',
          hourlyRate: fetchedProfile.hourly_rate !== null ? Number(fetchedProfile.hourly_rate) : undefined
        });
        setIsEditing(false);
      } catch (error: any) {
        if (error.response && error.response.status === 404) {
          setProfile(null);
          toast.info('Please create your profile.');
          reset({});
          setIsEditing(true);
        } else {
          console.error('Error fetching profile:', error);
          toast.error(error.response?.data?.message || 'Failed to load profile');
        }
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      const skillsArray = data.skills ? data.skills.split(',').map(s => s.trim()).filter(s => s) : [];
      const availabilityObject = { text: data.availability };

      const payload = {
        ...data,
        skills: skillsArray.map(name => ({ name })),
        availability: availabilityObject,
        hourlyRate: data.hourlyRate !== undefined ? Number(data.hourlyRate) : undefined
      };

      let response;
      if (profile) {
        response = await axios.patch(`http://localhost:5000/api/profile`, payload);
        toast.success('Profile updated successfully');
      } else {
        response = await axios.post(`http://localhost:5000/api/profile`, payload);
        toast.success('Profile created successfully');
      }

      await axios.get(`http://localhost:5000/api/profile/${user?.id}`)
        .then(res => {
          const updatedProfile = res.data.data.profile;
          setProfile(updatedProfile);
          reset({
            ...updatedProfile,
            skills: Array.isArray(updatedProfile.skills) ? updatedProfile.skills.map((s: any) => s.name).join(', ') : '',
            availability: updatedProfile.availability && typeof updatedProfile.availability === 'object' && updatedProfile.availability.text ? updatedProfile.availability.text : updatedProfile.availability || '',
            hourlyRate: updatedProfile.hourly_rate !== null ? Number(updatedProfile.hourly_rate) : undefined
          });
          setIsEditing(false);
        })
        .catch(err => {
          console.error('Error re-fetching profile after save:', err);
          toast.error('Failed to refresh profile data.');
        });

    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error(error.response?.data?.message || 'Failed to save profile');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Profile Information
            </h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>Update your profile information to help others find you.</p>
            </div>
            {!isEditing && profile && (
              <div className="text-right mb-4">
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Edit Profile
                </button>
              </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-6">
              {isEditing ? (
                <>
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="firstName"
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        {...register('firstName', { required: 'First name is required' })}
                      />
                      {errors.firstName && (
                        <p className="mt-2 text-sm text-red-600">{errors.firstName.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="lastName"
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        {...register('lastName', { required: 'Last name is required' })}
                      />
                      {errors.lastName && (
                        <p className="mt-2 text-sm text-red-600">{errors.lastName.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                      Department
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="department"
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="e.g., Computer Science, Electrical Engineering"
                        {...register('department', { required: 'Department is required' })}
                      />
                      {errors.department && (
                        <p className="mt-2 text-sm text-red-600">{errors.department.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                      Bio
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="bio"
                        rows={4}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        {...register('bio', { required: 'Bio is required' })}
                      />
                      {errors.bio && (
                        <p className="mt-2 text-sm text-red-600">{errors.bio.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="skills" className="block text-sm font-medium text-gray-700">
                      Skills
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="skills"
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="e.g., JavaScript, React, Node.js"
                        {...register('skills', { required: 'Skills are required' })}
                      />
                      {errors.skills && (
                        <p className="mt-2 text-sm text-red-600">{errors.skills.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="experience" className="block text-sm font-medium text-gray-700">
                      Experience
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="experience"
                        rows={3}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="e.g., 5 years at Google as Software Engineer"
                        {...register('experience', { required: 'Experience is required' })}
                      />
                      {errors.experience && (
                        <p className="mt-2 text-sm text-red-600">{errors.experience.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="availability" className="block text-sm font-medium text-gray-700">
                      Availability
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="availability"
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="e.g., Weekdays 6-9 PM EST or {'Monday': '9-5', 'Tuesday': '9-12'}"
                        {...register('availability', { required: 'Availability is required' })}
                      />
                      {errors.availability && (
                        <p className="mt-2 text-sm text-red-600">{errors.availability.message}</p>
                      )}
                    </div>
                  </div>

                  {user?.role === 'mentor' && (
                    <div>
                      <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700">
                        Hourly Rate ($)
                      </label>
                      <div className="mt-1">
                        <input
                          type="number"
                          id="hourlyRate"
                          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          {...register('hourlyRate', {
                            required: 'Hourly rate is required for mentors',
                            min: { value: 0, message: 'Hourly rate must be positive' }
                          })}
                        />
                        {errors.hourlyRate && (
                          <p className="mt-2 text-sm text-red-600">{errors.hourlyRate.message}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Save Changes
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="pb-4">
                    <p className="text-sm font-medium text-gray-700">First Name</p>
                    <p className="mt-1 text-sm text-gray-900">{profile?.first_name}</p>
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-medium text-gray-700">Last Name</p>
                    <p className="mt-1 text-sm text-gray-900">{profile?.last_name}</p>
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-medium text-gray-700">Department</p>
                    <p className="mt-1 text-sm text-gray-900">{profile?.department}</p>
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-medium text-gray-700">Bio</p>
                    <p className="mt-1 text-sm text-gray-900">{profile?.bio}</p>
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-medium text-gray-700">Skills</p>
                    <p className="mt-1 text-sm text-gray-900">
                      {Array.isArray(profile?.skills) ? profile.skills.map((s: any) => s.name).join(', ') : 'N/A'}
                    </p>
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-medium text-gray-700">Experience</p>
                    <p className="mt-1 text-sm text-gray-900">{profile?.experience}</p>
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-medium text-gray-700">Availability</p>
                    <p className="mt-1 text-sm text-gray-900">
                      {profile?.availability && typeof profile.availability === 'object' && profile.availability.text ? profile.availability.text : profile?.availability || 'N/A'}
                    </p>
                  </div>
                  {user?.role === 'mentor' && profile?.hourly_rate && (
                    <div className="pb-4">
                      <p className="text-sm font-medium text-gray-700">Hourly Rate ($)</p>
                      <p className="mt-1 text-sm text-gray-900">{profile.hourly_rate}</p>
                    </div>
                  )}
                </>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 