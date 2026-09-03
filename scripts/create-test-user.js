import { query } from '../lib/db.js';
import bcrypt from 'bcryptjs';

async function createTestUser() {
    try {
        const hashedPassword = await bcrypt.hash('testpassword123', 12);
        
        const result = await query(
            `INSERT INTO users (name, email, username, phone, password, email_verified) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
             RETURNING id`,
            ['Test User', 'test@example.com', 'testuser', '+1 (555) 123-4567', hashedPassword, true]
        );
        
        console.log('Test user created/found with ID:', result[0]?.id);
        console.log('Email: test@example.com');
        console.log('Password: testpassword123');
    } catch (error) {
        console.error('Error creating test user:', error);
    }
}

createTestUser();
