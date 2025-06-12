import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { RowDataPacket } from 'mysql2';

export const createProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('createProfile: Received request to create profile', req.body);
    const userId = (req as any).user.id;
    const {
      firstName,
      lastName,
      department,
      bio,
      experience,
      skills,
      availability,
      hourlyRate
    } = req.body;

    // Check if profile already exists
    const [existingProfiles] = await pool.execute(
      'SELECT * FROM profiles WHERE user_id = ?',
      [userId]
    );

    if (Array.isArray(existingProfiles) && existingProfiles.length > 0) {
      throw new AppError('Profile already exists', 400);
    }

    // Create profile
    const profileId = uuidv4();
    await pool.execute(
      'INSERT INTO profiles (id, user_id, first_name, last_name, department, bio, experience, hourly_rate, availability) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        profileId,
        userId,
        firstName,
        lastName,
        department,
        bio || null,
        experience || null,
        hourlyRate || null,
        JSON.stringify(availability)
      ]
    );

    // Add skills
    if (skills && skills.length > 0) {
      for (const skill of skills) {
        // Try to insert the skill, ignore if it already exists (due to unique name)
        await pool.execute(
          'INSERT IGNORE INTO skills (id, name) VALUES (?, ?)',
          [uuidv4(), skill.name]
        );

        // Retrieve the actual skill_id, whether newly inserted or existing
        const [skillRows] = await pool.execute<RowDataPacket[]>(
          'SELECT id FROM skills WHERE name = ?',
          [skill.name]
        );
        const skillId = (skillRows as RowDataPacket[])[0].id;

        // Add to user_skills
        await pool.execute(
          'INSERT INTO user_skills (user_id, skill_id, proficiency_level) VALUES (?, ?, ?)',
          [userId, skillId, skill.proficiencyLevel || 'intermediate']
        );
      }
    }

    res.status(201).json({
      status: 'success',
      data: {
        profile: {
          id: profileId,
          userId,
          firstName,
          lastName,
          department,
          bio,
          experience,
          skills,
          availability,
          hourlyRate
        }
      }
    });
  } catch (error) {
    console.error('createProfile: Error', error);
    next(error);
  }
};

export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;

    // Get profile
    const [profiles] = await pool.execute(
      'SELECT * FROM profiles WHERE user_id = ?',
      [userId]
    );

    if (!Array.isArray(profiles) || profiles.length === 0) {
      throw new AppError('Profile not found', 404);
    }

    const profile = profiles[0] as any;

    // Get skills
    const [skills] = await pool.execute(
      `SELECT s.name, us.proficiency_level 
       FROM skills s 
       JOIN user_skills us ON s.id = us.skill_id 
       WHERE us.user_id = ?`,
      [userId]
    );

    res.json({
      status: 'success',
      data: {
        profile: {
          ...profile,
          skills: Array.isArray(skills) ? skills : []
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('updateProfile: Received request to update profile', req.body);
    const userId = (req as any).user.id;
    const {
      firstName,
      lastName,
      department,
      bio,
      experience,
      skills,
      availability,
      hourlyRate
    } = req.body;

    // Update profile
    const updateFields = [];
    const updateValues = [];

    if (firstName) {
      updateFields.push('first_name = ?');
      updateValues.push(firstName);
    }
    if (lastName) {
      updateFields.push('last_name = ?');
      updateValues.push(lastName);
    }
    if (department) {
      updateFields.push('department = ?');
      updateValues.push(department);
    }
    if (bio !== undefined) {
      updateFields.push('bio = ?');
      updateValues.push(bio);
    }
    if (experience !== undefined) {
      updateFields.push('experience = ?');
      updateValues.push(experience);
    }
    if (availability) {
      updateFields.push('availability = ?');
      updateValues.push(JSON.stringify(availability));
    }
    if (hourlyRate !== undefined) {
      updateFields.push('hourly_rate = ?');
      updateValues.push(hourlyRate);
    }

    if (updateFields.length > 0) {
      updateValues.push(userId);
      await pool.execute(
        `UPDATE profiles SET ${updateFields.join(', ')} WHERE user_id = ?`,
        updateValues
      );
    }

    // Update skills if provided
    if (skills) {
      // Remove existing skills
      await pool.execute('DELETE FROM user_skills WHERE user_id = ?', [userId]);

      // Add new skills
      for (const skill of skills) {
        // Try to insert the skill, ignore if it already exists (due to unique name)
        await pool.execute(
          'INSERT IGNORE INTO skills (id, name) VALUES (?, ?)',
          [uuidv4(), skill.name]
        );

        // Retrieve the actual skill_id, whether newly inserted or existing
        const [skillRows] = await pool.execute<RowDataPacket[]>(
          'SELECT id FROM skills WHERE name = ?',
          [skill.name]
        );
        const skillId = (skillRows as RowDataPacket[])[0].id;

        // Add to user_skills
        await pool.execute(
          'INSERT INTO user_skills (user_id, skill_id, proficiency_level) VALUES (?, ?, ?)',
          [userId, skillId, skill.proficiencyLevel || 'intermediate']
        );
      }
    }

    res.json({
      status: 'success',
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('updateProfile: Error', error);
    next(error);
  }
};

export const searchMentors = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { skill, department, rating } = req.query;
    console.log('searchMentors: Received search query:', { skill, department, rating });

    let query = `
      SELECT DISTINCT p.*, u.id as user_id
      FROM profiles p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN user_skills us ON u.id = us.user_id
      LEFT JOIN skills s ON us.skill_id = s.id
      WHERE u.role = 'mentor'
    `;

    const queryParams = [];

    if (skill) {
      query += ' AND s.name LIKE ?';
      queryParams.push(`%${skill}%`);
    }

    if (department) {
      query += ' AND p.department LIKE ?';
      queryParams.push(`%${department}%`);
    }

    if (rating) {
      query += `
        AND EXISTS (
          SELECT 1 FROM ratings r
          WHERE r.rated_id = u.id
          GROUP BY r.rated_id
          HAVING AVG(r.rating) >= ?
        )
      `;
      queryParams.push(rating);
    }

    console.log('searchMentors: SQL query:', query);
    console.log('searchMentors: Query parameters:', queryParams);

    const [mentors] = await pool.execute(query, queryParams);
    console.log('searchMentors: Mentors found (raw):', mentors);

    // Get skills for each mentor
    const mentorsWithSkills = await Promise.all(
      (Array.isArray(mentors) ? mentors : []).map(async (mentor: any) => {
        const [skills] = await pool.execute(
          `SELECT s.name, us.proficiency_level 
           FROM skills s 
           JOIN user_skills us ON s.id = us.skill_id 
           WHERE us.user_id = ?`,
          [mentor.user_id]
        );

        return {
          ...mentor,
          skills: Array.isArray(skills) ? skills : []
        };
      })
    );

    res.json({
      status: 'success',
      data: {
        mentors: mentorsWithSkills
      }
    });
  } catch (error) {
    next(error);
  }
}; 