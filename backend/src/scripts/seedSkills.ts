import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';

const initialSkills = [
  'JavaScript',
  'Python',
  'Java',
  'React',
  'Node.js',
  'SQL',
  'Data Science',
  'Machine Learning',
  'Web Development',
  'Mobile Development',
  'C',
  'C++',
  'TypeScript',
  'Angular',
  'Vue.js',
  'AWS',
  'Docker',
  'Kubernetes',
  'DevOps',
  'UI/UX Design'
];

async function seedSkills() {
  try {
    console.log('Starting skills seeding...');
    
    for (const skillName of initialSkills) {
      // Check if skill already exists
      const [existingSkills] = await pool.execute(
        'SELECT id FROM skills WHERE name = ?',
        [skillName]
      );

      if (!Array.isArray(existingSkills) || existingSkills.length === 0) {
        // Insert new skill
        await pool.execute(
          'INSERT INTO skills (id, name) VALUES (?, ?)',
          [uuidv4(), skillName]
        );
        console.log(`Added skill: ${skillName}`);
      } else {
        console.log(`Skill already exists: ${skillName}`);
      }
    }

    console.log('Skills seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding skills:', error);
    process.exit(1);
  }
}

seedSkills(); 