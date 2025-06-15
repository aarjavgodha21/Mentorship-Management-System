import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { toast } from 'react-toastify';
import api from '../api/axios';
import { Mentor, Session } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface MentorSelectionProps {
  onSessionBooked: (session: Session) => void;
  initialMentor?: Mentor | null;
  requestId?: string;
}

const MentorSelection: React.FC<MentorSelectionProps> = ({ onSessionBooked, initialMentor, requestId }) => {
  const { user } = useAuth(); // Get current user from AuthContext
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [selectedMentors, setSelectedMentors] = useState<Mentor[]>(initialMentor ? [initialMentor] : []);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [bookedSessions, setBookedSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [menteeAvailability, setMenteeAvailability] = useState<any>(null);

  useEffect(() => {
    fetchMentors();
    fetchBookedSessions();
    if (user?.role === 'mentee') {
      fetchMenteeAvailability();
    }
  }, [user]);

  const fetchMenteeAvailability = async () => {
    if (!user || !user.id) return;
    try {
      const response = await api.get(`/profile/${user.id}`);
      const availabilityData = response.data.data.profile.availability;
      if (typeof availabilityData === 'string') {
        try {
          setMenteeAvailability(JSON.parse(availabilityData));
        } catch (e) {
          console.error('Failed to parse mentee availability string:', availabilityData, e);
          setMenteeAvailability(null);
        }
      } else if (typeof availabilityData === 'object' && availabilityData !== null) {
        setMenteeAvailability(availabilityData);
      } else {
        setMenteeAvailability(null);
      }
    } catch (error: any) {
      console.error('Error fetching mentee availability:', error.response?.data || error.message || error);
      toast.error('Failed to load mentee availability');
    }
  };

  const fetchMentors = async () => {
    try {
      const response = await api.get('/profile/search/mentors');
      setMentors(response.data.data.mentors);
    } catch (error) {
      console.error('Error fetching mentors:', error);
      toast.error('Failed to load mentors');
    }
  };

  const fetchBookedSessions = async () => {
    try {
      const response = await api.get('/mentorship/sessions');
      setBookedSessions(response.data.data.sessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load booked sessions');
    }
  };

  const isDateBooked = (date: Date) => {
    return bookedSessions.some(session => {
      const sessionDate = new Date(session.startTime);
      return session.status === 'scheduled' && sessionDate.toDateString() === date.toDateString();
    });
  };

  const isTimeSlotAvailable = (date: Date, time: string) => {
    console.log('isTimeSlotAvailable called for:', { date, time });
    console.log('Selected Mentors:', selectedMentors);
    console.log('Mentee Availability:', menteeAvailability);

    if (!selectedMentors.length || !menteeAvailability || !menteeAvailability.days) {
      console.log('isTimeSlotAvailable: Missing selected mentors or mentee availability');
      return false; // Ensure mentee availability is loaded and has a days property
    }

    const [slotStartTime, slotEndTime] = time.split('-');
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
    console.log('Day of Week:', dayOfWeek);
    console.log('Slot Start Time:', slotStartTime);
    console.log('Slot End Time:', slotEndTime);

    // Check mentee availability
    const isMenteeAvailable =
      menteeAvailability.days.includes(dayOfWeek) &&
      slotStartTime >= menteeAvailability.startTime &&
      slotEndTime <= menteeAvailability.endTime;

    console.log('Is Mentee Available:', isMenteeAvailable);

    if (!isMenteeAvailable) return false;

    // Check if any selected mentor is available at this time
    return selectedMentors.some(mentor => {
      const mentorAvailability = mentor.availability;
      console.log('Mentor Availability for', mentor.name, ':', mentorAvailability);
      if (!mentorAvailability || !mentorAvailability.days) {
        console.log('Mentor', mentor.name, 'has no availability data or days');
        return false; // Add null/undefined check for mentorAvailability
      }
      
      const isMentorAvailable =
        mentorAvailability.days.includes(dayOfWeek) &&
        slotStartTime >= mentorAvailability.startTime &&
        slotEndTime <= mentorAvailability.endTime;
      
      console.log('Is Mentor', mentor.name, 'Available:', isMentorAvailable);
      return isMentorAvailable;
    });
  };

  const handleBookSession = async () => {
    if (!selectedDate || !selectedTime || !selectedMentors.length) {
      toast.error('Please select a mentor, date, and time');
      return;
    }

    if (requestId === undefined) {
      toast.error('Mentorship request ID is missing. Cannot book session.');
      return;
    }

    setLoading(true);
    try {
      const [startHour, startMinute] = selectedTime.split('-')[0].split(':').map(Number);
      const [endHour, endMinute] = selectedTime.split('-')[1].split(':').map(Number);

      const sessionStartTime = new Date(selectedDate);
      sessionStartTime.setHours(startHour, startMinute, 0, 0);
      
      const sessionEndTime = new Date(selectedDate);
      sessionEndTime.setHours(endHour, endMinute, 0, 0);

      // Format to YYYY-MM-DD HH:MM:SS (local time) for MySQL DATETIME
      const toMySQLDateTime = (date: Date) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      };

      const formattedMySQLStartTime = toMySQLDateTime(sessionStartTime);
      const formattedMySQLEndTime = toMySQLDateTime(sessionEndTime);

      const response = await api.post('/mentorship/sessions', {
        requestId: requestId,
        startTime: formattedMySQLStartTime,
        endTime: formattedMySQLEndTime,
      });

      toast.success('Session booked successfully!');
      onSessionBooked(response.data.data.session);
      
      // Reset selections
      setSelectedDate(null);
      setSelectedTime('');
      setSelectedMentors([]);
      
      // Refresh booked sessions
      fetchBookedSessions();
    } catch (error: any) {
      console.error('Error booking session:', error.response?.data || error.message || error);
      toast.error(error.response?.data?.message || 'Something went wrong!');
    } finally {
      setLoading(false);
    }
  };

  const timeSlots = [
    '09:00-10:00',
    '10:00-11:00',
    '11:00-12:00',
    '13:00-14:00',
    '14:00-15:00',
    '15:00-16:00',
    '16:00-17:00',
  ];

  return (
    <div className="space-y-6">
      {!initialMentor && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Select Mentors</label>
          <Select
            isMulti
            options={mentors.map(mentor => ({
              value: mentor.id,
              label: mentor.name,
              ...mentor
            }))}
            value={selectedMentors.map(mentor => ({
              value: mentor.id,
              label: mentor.name,
              ...mentor
            }))}
            onChange={(selected) => setSelectedMentors(selected ? selected.map(s => ({
              id: s.value,
              name: s.label,
              skills: s.skills,
              availability: s.availability
            })) : [])}
            className="mt-1"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Select Date</label>
        <DatePicker
          selected={selectedDate}
          onChange={setSelectedDate}
          minDate={new Date()}
          filterDate={(date) => !isDateBooked(date)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          placeholderText="Select a date"
        />
      </div>

      {selectedDate && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Select Time</label>
          <select
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          >
            <option value="">Select a time slot</option>
            {timeSlots.map(slot => (
              <option
                key={slot}
                value={slot}
                disabled={!isTimeSlotAvailable(selectedDate, slot)}
              >
                {slot}
              </option>
            ))}
          </select>
        </div>
      )}

      <button
        onClick={handleBookSession}
        disabled={loading || !selectedDate || !selectedTime || !selectedMentors.length}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? 'Booking...' : 'Book Session'}
      </button>
    </div>
  );
};

export default MentorSelection; 