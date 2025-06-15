import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { AppError } from '../middleware/errorHandler';

export const createRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('createRequest: Received request body', req.body);
    const menteeId = (req as any).user.id;
    const { mentorId, message } = req.body;
    console.log('createRequest: Extracted mentorId', mentorId);

    // Check if user is a mentee
    if ((req as any).user.role !== 'mentee') {
      throw new AppError('Only mentees can create mentorship requests', 403);
    }

    // Check if mentor exists
    const [mentors] = await pool.execute(
      'SELECT * FROM users WHERE id = ? AND role = ?',
      [mentorId, 'mentor']
    );

    if (!Array.isArray(mentors) || mentors.length === 0) {
      throw new AppError('Mentor not found', 404);
    }

    // Create request
    const requestId = uuidv4();
    await pool.execute(
      'INSERT INTO mentorship_requests (id, mentee_id, mentor_id, message) VALUES (?, ?, ?, ?)',
      [requestId, menteeId, mentorId, message || null]
    );

    res.status(201).json({
      status: 'success',
      data: {
        request: {
          id: requestId,
          menteeId,
          mentorId,
          message,
          status: 'pending'
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getRequests = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    let query = `
      SELECT mr.id, mr.status, mr.created_at as createdAt,
             mentor.id as mentorId, mentor.name as mentorName,
             p.availability as mentorAvailability,
             mentee.id as menteeId, mentee.name as menteeName
      FROM mentorship_requests mr
      JOIN users mentor ON mr.mentor_id = mentor.id
      JOIN profiles p ON mentor.id = p.user_id
      JOIN users mentee ON mr.mentee_id = mentee.id
      WHERE ${userRole === 'mentor' ? 'mr.mentor_id' : 'mr.mentee_id'} = ?
    `;

    const [rows] = await pool.execute(query, [userId]);
    const requests = (rows as any[]).map(row => ({
      id: row.id,
      mentorId: row.mentorId,
      menteeId: row.menteeId,
      status: row.status,
      createdAt: row.createdAt,
      mentor: {
        id: row.mentorId,
        name: row.mentorName || '',
        skills: '', // Initialize as empty string
        availability: null, // Initialize availability as null
      },
      mentee: {
        id: row.menteeId,
        name: row.menteeName || '',
      }
    }));

    // Fetch skills for all mentors in the requests
    const mentorIds = [...new Set(requests.map(req => req.mentorId))];
    if (mentorIds.length > 0) {
      const [skillRows] = await pool.execute(
        `SELECT us.user_id, s.name as skillName
         FROM user_skills us
         JOIN skills s ON us.skill_id = s.id
         WHERE us.user_id IN (${mentorIds.map(() => '?').join(', ')})`,
        mentorIds
      );

      const mentorSkillsMap = new Map<string, string[]>();
      (skillRows as any[]).forEach(row => {
        if (!mentorSkillsMap.has(row.user_id)) {
          mentorSkillsMap.set(row.user_id, []);
        }
        mentorSkillsMap.get(row.user_id)?.push(row.skillName);
      });

      requests.forEach(req => {
        if (mentorSkillsMap.has(req.mentorId)) {
          req.mentor.skills = mentorSkillsMap.get(req.mentorId)?.join(', ') || '';
        }
        // Also add mentorAvailability to the mentor object
        const originalRow = (rows as any[]).find(r => r.mentorId === req.mentorId);
        if (originalRow && originalRow.mentorAvailability) {
          req.mentor.availability = originalRow.mentorAvailability; // Directly assign availability
        }
      });
    }

    res.json({
      status: 'success',
      data: {
        requests: requests
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateRequestStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;
    const userId = (req as any).user.id;

    // Check if request exists and user is the mentor
    const [requests] = await pool.execute(
      'SELECT * FROM mentorship_requests WHERE id = ? AND mentor_id = ?',
      [requestId, userId]
    );

    if (!Array.isArray(requests) || requests.length === 0) {
      throw new AppError('Request not found or unauthorized', 404);
    }

    // Update status
    await pool.execute(
      'UPDATE mentorship_requests SET status = ? WHERE id = ?',
      [status, requestId]
    );

    res.json({
      status: 'success',
      message: 'Request status updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const createSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { requestId, startTime, endTime } = req.body;
    const userId = (req as any).user.id;

    // Check if request exists and is accepted
    const [requests] = await pool.execute(
      'SELECT * FROM mentorship_requests WHERE id = ? AND status = ?',
      [requestId, 'accepted']
    );

    if (!Array.isArray(requests) || requests.length === 0) {
      throw new AppError('Request not found or not accepted', 404);
    }

    const request = requests[0] as any;

    // Check if user is either mentor or mentee
    if (userId !== request.mentor_id && userId !== request.mentee_id) {
      throw new AppError('Unauthorized', 403);
    }

    // Create session
    const sessionId = uuidv4();

    // The frontend now sends startTime and endTime in YYYY-MM-DD HH:MM:SS format (local time)
    // So, we can directly use them.
    const formattedStartTime = startTime; // Already formatted by frontend
    const formattedEndTime = endTime;     // Already formatted by frontend

    await pool.execute(
      'INSERT INTO sessions (id, request_id, start_time, end_time) VALUES (?, ?, ?, ?)',
      [sessionId, requestId, formattedStartTime, formattedEndTime]
    );

    res.status(201).json({
      status: 'success',
      data: {
        session: {
          id: sessionId,
          requestId,
          startTime,
          endTime,
          status: 'scheduled'
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getSessions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user.id;

    const [rows] = await pool.execute(
      `SELECT s.id, s.request_id as requestId, s.start_time as startTime, s.end_time as endTime, s.status, s.notes,
              mr.mentor_id as mentorId, mr.mentee_id as menteeId,
              mentor.name as mentorName,
              mentee.name as menteeName
       FROM sessions s
       JOIN mentorship_requests mr ON s.request_id = mr.id
       JOIN users mentor ON mr.mentor_id = mentor.id
       JOIN users mentee ON mr.mentee_id = mentee.id
       WHERE mr.mentor_id = ? OR mr.mentee_id = ?
       ORDER BY s.start_time DESC`,
      [userId, userId]
    );

    const sessions = (rows as any[]).map(row => ({
      id: row.id,
      requestId: row.requestId,
      startTime: row.startTime, // Send as is (local time string from DB)
      endTime: row.endTime,     // Send as is (local time string from DB)
      status: row.status,
      notes: row.notes,
      mentorId: row.mentorId,
      menteeId: row.menteeId,
      mentor: {
        id: row.mentorId,
        name: row.mentorName || '',
        // skills: '' // Skills not needed for sessions
      },
      mentee: {
        id: row.menteeId,
        name: row.menteeName || '',
      }
    }));

    res.json({
      status: 'success',
      data: {
        sessions: sessions
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateSessionStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sessionId } = req.params;
    const { status, notes } = req.body;
    const userId = (req as any).user.id;

    // Check if session exists and user is authorized
    const [sessions] = await pool.execute(
      `SELECT s.*, mr.mentor_id, mr.mentee_id
       FROM sessions s
       JOIN mentorship_requests mr ON s.request_id = mr.id
       WHERE s.id = ? AND (mr.mentor_id = ? OR mr.mentee_id = ?)`,
      [sessionId, userId, userId]
    );

    if (!Array.isArray(sessions) || sessions.length === 0) {
      throw new AppError('Session not found or unauthorized', 404);
    }

    // Update status and notes
    const updateFields = ['status = ?'];
    const updateValues = [status];

    if (notes !== undefined) {
      updateFields.push('notes = ?');
      updateValues.push(notes);
    }

    updateValues.push(sessionId);

    await pool.execute(
      `UPDATE sessions SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json({
      status: 'success',
      message: 'Session updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const createRating = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sessionId, ratedId, rating, comment } = req.body;
    const raterId = (req as any).user.id;

    // Check if session exists and is completed
    const [sessions] = await pool.execute(
      `SELECT s.*, mr.mentor_id, mr.mentee_id
       FROM sessions s
       JOIN mentorship_requests mr ON s.request_id = mr.id
       WHERE s.id = ? AND s.status = ?`,
      [sessionId, 'completed']
    );

    if (!Array.isArray(sessions) || sessions.length === 0) {
      throw new AppError('Session not found or not completed', 404);
    }

    const session = sessions[0] as any;

    // Check if user is either mentor or mentee
    if (raterId !== session.mentor_id && raterId !== session.mentee_id) {
      throw new AppError('Unauthorized', 403);
    }

    // Create rating
    const ratingId = uuidv4();

    await pool.execute(
      'INSERT INTO ratings (id, session_id, rater_id, rated_id, rating, comment) VALUES (?, ?, ?, ?, ?, ?)',
      [ratingId, sessionId, raterId, ratedId, rating, comment]
    );

    res.status(201).json({
      status: 'success',
      data: {
        rating: {
          id: ratingId,
          sessionId,
          raterId,
          ratedId,
          rating,
          comment
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { requestId } = req.params;
    const userId = (req as any).user.id;

    // Check if request exists and if the user is the mentee who sent it
    const [requests] = await pool.execute(
      'SELECT * FROM mentorship_requests WHERE id = ? AND mentee_id = ?',
      [requestId, userId]
    );

    if (!Array.isArray(requests) || requests.length === 0) {
      throw new AppError('Request not found or unauthorized', 404);
    }

    // Delete the request
    await pool.execute(
      'DELETE FROM mentorship_requests WHERE id = ?',
      [requestId]
    );

    res.status(204).json({
      status: 'success',
      message: 'Mentorship request cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
};
