import { query } from '../lib/db.js';

async function updateUserColumns() {
    try {
        console.log('Updating user columns...');
        
        // Check existing columns
        const columns = await query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users'
        `);
        const columnNames = columns.map(c => c.column_name);
        
        const columnsToAdd = [
            { name: 'balance', type: 'DECIMAL(15, 2)', default: '0.00' },
            { name: 'total_profit', type: 'DECIMAL(15, 2)', default: '0.00' },
            { name: 'total_bonus', type: 'DECIMAL(15, 2)', default: '0.00' },
            { name: 'total_withdrawal', type: 'DECIMAL(15, 2)', default: '0.00' },
            { name: 'kyc_verified', type: 'BOOLEAN', default: 'FALSE' }
        ];
        
        for (const col of columnsToAdd) {
            if (!columnNames.includes(col.name)) {
                await query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type} DEFAULT ${col.default}`);
                console.log(`Added column: ${col.name}`);
            } else {
                console.log(`Column ${col.name} already exists`);
            }
        }
        
        // Update existing users to have default values
        await query(`
            UPDATE users 
            SET balance = COALESCE(balance, 0.00),
                total_profit = COALESCE(total_profit, 0.00),
                total_bonus = COALESCE(total_bonus, 0.00),
                total_withdrawal = COALESCE(total_withdrawal, 0.00),
                kyc_verified = COALESCE(kyc_verified, FALSE)
            WHERE balance IS NULL OR total_profit IS NULL OR total_bonus IS NULL OR total_withdrawal IS NULL OR kyc_verified IS NULL
        `);
        
        console.log('User columns updated successfully');
    } catch (error) {
        console.error('Error updating columns:', error);
    }
}

updateUserColumns();
