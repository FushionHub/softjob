import { query } from '../lib/db.js';

const plans = [
    { name: 'Basic', percentage: 5, duration: '24 hours', min_investment: 100, max_investment: 999 },
    { name: 'Essential', percentage: 10, duration: '48 hours', min_investment: 1000, max_investment: 4999 },
    { name: 'Standard', percentage: 15, duration: '72 hours', min_investment: 5000, max_investment: 14999 },
    { name: 'Professional', percentage: 25, duration: '7 days', min_investment: 15000, max_investment: 49999 },
    { name: 'Fortune Path', percentage: 40, duration: '14 days', min_investment: 50000, max_investment: 99999 },
    { name: 'Golden', percentage: 60, duration: '30 days', min_investment: 100000, max_investment: 499999 },
    { name: 'Digital Bonus', percentage: 100, duration: '60 days', min_investment: 500000, max_investment: 9999999 }
];

async function seedPlans() {
    try {
        for (const plan of plans) {
            await query(
                `INSERT INTO investment_plans (name, percentage, duration, min_investment, max_investment) 
                 VALUES ($1, $2, $3, $4, $5) 
                 ON CONFLICT DO NOTHING`,
                [plan.name, plan.percentage, plan.duration, plan.min_investment, plan.max_investment]
            );
            console.log(`Inserted/verified plan: ${plan.name}`);
        }
        console.log('Investment plans seeded successfully');
    } catch (error) {
        console.error('Error seeding plans:', error);
    }
}

seedPlans();
