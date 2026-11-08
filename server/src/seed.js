import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { connectDB, disconnectDB } from './config/db.js';
import { User } from './models/User.js';
import { CareCircle } from './models/CareCircle.js';
import { Visit } from './models/Visit.js';
import { Task } from './models/Task.js';
import { ActivityLog } from './models/ActivityLog.js';
import { AiSummary } from './models/AiSummary.js';
import { syncVisitConflicts } from './services/conflictService.js';

dotenv.config();

export const seedDatabase = async () => {
  if (mongoose.connection.readyState === 0) {
    console.log('[Seed] Connecting to database...');
    await connectDB();
  }

  console.log('[Seed] Clearing existing collections...');
  await Promise.all([
    User.deleteMany({}),
    CareCircle.deleteMany({}),
    Visit.deleteMany({}),
    Task.deleteMany({}),
    ActivityLog.deleteMany({}),
    AiSummary.deleteMany({}),
  ]);

  console.log('[Seed] Creating demo users...');
  const salt = await bcrypt.genSalt(10);
  const commonPassword = await bcrypt.hash('Password123!', salt);

  const sarah = await User.create({
    name: 'Sarah Jenkins',
    email: 'sarah@carevisit.demo',
    passwordHash: commonPassword,
    phone: '+1 (555) 234-5678',
    avatarColor: '#3B82F6', // Blue
  });

  const david = await User.create({
    name: 'David Miller',
    email: 'david@carevisit.demo',
    passwordHash: commonPassword,
    phone: '+1 (555) 876-5432',
    avatarColor: '#10B981', // Emerald
  });

  const priya = await User.create({
    name: 'Priya Sharma',
    email: 'priya@carevisit.demo',
    passwordHash: commonPassword,
    phone: '+1 (555) 345-6789',
    avatarColor: '#8B5CF6', // Purple
  });

  const robert = await User.create({
    name: 'Robert Vance',
    email: 'robert@carevisit.demo',
    passwordHash: commonPassword,
    phone: '+1 (555) 456-7890',
    avatarColor: '#F59E0B', // Amber
  });

  console.log('[Seed] Creating demo Care Circle...');
  const circle = await CareCircle.create({
    name: 'Eleanor Vance Care Circle',
    careRecipient: {
      name: 'Eleanor Vance',
      notes:
        'Age 78. Recovering from left knee replacement. Low sodium diet. Enjoys chamomile tea at 3 PM and classical music. Primary Physician: Dr. Robert Hughes (555-0192).',
      address: '42 Elmwood Terrace, Springfield, IL',
    },
    members: [
      { userId: sarah._id, role: 'Family Admin', joinedAt: new Date(Date.now() - 25 * 86400000) },
      { userId: david._id, role: 'Caregiver', joinedAt: new Date(Date.now() - 24 * 86400000) },
      { userId: priya._id, role: 'Caregiver', joinedAt: new Date(Date.now() - 20 * 86400000) },
      { userId: robert._id, role: 'Viewer', joinedAt: new Date(Date.now() - 15 * 86400000) },
    ],
  });

  console.log('[Seed] Generating 3 weeks of visits with deliberate conflicts...');
  const now = new Date();
  const dayMs = 86400000;

  // Helper to construct dates at specific hours
  const createDateAt = (dayOffset, hours, minutes = 0) => {
    const d = new Date(now.getTime() + dayOffset * dayMs);
    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  const visitTemplates = [
    // === PAST WEEK (Days -12 to -2) - Completed visits ===
    {
      title: 'Morning Medication & Breakfast',
      category: 'Medication Reminder',
      caregiverId: sarah._id,
      startTime: createDateAt(-10, 8, 30),
      endTime: createDateAt(-10, 10, 0),
      status: 'Completed',
      location: 'Home',
      notes: 'Ensure blood pressure pill is taken with oatmeal',
      completedNotes: 'Eleanor was in great spirits. Oatmeal finished, BP normal (122/78).',
      tasks: [
        { description: 'Help prepare warm oatmeal and sliced banana', isCompleted: true, completedBy: sarah._id },
        { description: 'Administer morning prescription with water', isCompleted: true, completedBy: sarah._id },
        { description: 'Record resting blood pressure in health log', isCompleted: true, completedBy: sarah._id },
      ],
    },
    {
      title: 'Knee Mobility & Afternoon Tea',
      category: 'Personal Care',
      caregiverId: priya._id,
      startTime: createDateAt(-9, 14, 0),
      endTime: createDateAt(-9, 15, 30),
      status: 'Completed',
      location: 'Home',
      notes: 'PT prescribed gentle quad stretches',
      completedNotes: 'Completed 15 minutes of seated leg lifts. Eleanor walked around the garden with walker.',
      tasks: [
        { description: '15 min gentle quad and ankle stretches', isCompleted: true, completedBy: priya._id },
        { description: 'Serve chamomile tea with crackers', isCompleted: true, completedBy: priya._id },
        { description: 'Ensure walker rubber stoppers are clean', isCompleted: true, completedBy: priya._id },
      ],
    },
    {
      title: 'Weekly Grocery Stock & Pantry Check',
      category: 'Grocery & Meals',
      caregiverId: david._id,
      startTime: createDateAt(-7, 11, 0),
      endTime: createDateAt(-7, 13, 0),
      status: 'Completed',
      location: 'Trader Joe’s & Home',
      notes: 'Buy low sodium broth, fresh spinach, and almond milk',
      completedNotes: 'Pantry fully restocked. Put away milk and fresh produce.',
      tasks: [
        { description: 'Purchase low-sodium groceries from list', isCompleted: true, completedBy: david._id },
        { description: 'Check fridge for expired dairy products', isCompleted: true, completedBy: david._id },
        { description: 'Pre-cut melon and store in glass containers', isCompleted: true, completedBy: david._id },
      ],
    },
    {
      title: 'Doctor Follow-Up Transport',
      category: 'Transport & Appointments',
      caregiverId: sarah._id,
      startTime: createDateAt(-5, 10, 0),
      endTime: createDateAt(-5, 12, 30),
      status: 'Completed',
      location: 'St. Jude Orthopedic Clinic',
      notes: 'Dr. Hughes 6-week post-op checkup',
      completedNotes: 'Dr. Hughes confirmed bone healing is excellent. Approved gradual reduction of walker use.',
      tasks: [
        { description: 'Pack Medicare card and ID in purse', isCompleted: true, completedBy: sarah._id },
        { description: 'Safely transfer Eleanor into car with seat cushion', isCompleted: true, completedBy: sarah._id },
        { description: 'Obtain updated physical therapy prescription', isCompleted: true, completedBy: sarah._id },
      ],
    },
    {
      title: 'Evening Companionship & Scrabble',
      category: 'Companionship',
      caregiverId: david._id,
      startTime: createDateAt(-3, 17, 30),
      endTime: createDateAt(-3, 19, 0),
      status: 'Completed',
      location: 'Home',
      notes: 'Keep mind engaged with word games',
      completedNotes: 'Played 2 rounds of Scrabble. She won the second round!',
      tasks: [
        { description: 'Play Scrabble or crossword puzzle', isCompleted: true, completedBy: david._id },
        { description: 'Check nightstand water pitcher is full', isCompleted: true, completedBy: david._id },
      ],
    },

    // === CURRENT WEEK (Days -1 to +3) ===
    {
      title: 'Morning Check-in & Light Tidy',
      category: 'Light Household Help',
      caregiverId: sarah._id,
      startTime: createDateAt(0, 9, 0), // Today
      endTime: createDateAt(0, 10, 30),
      status: 'In Progress',
      location: 'Home',
      notes: 'Fold clean laundry and check heating thermostat',
      tasks: [
        { description: 'Fold and stow bedroom laundry', isCompleted: true, completedBy: sarah._id },
        { description: 'Refill 7-day pill organizer for next week', isCompleted: false },
        { description: 'Inspect bathroom grab rails for stability', isCompleted: true, completedBy: sarah._id },
      ],
    },

    // DELIBERATE CONFLICT 1: Overlapping visits tomorrow for the same care recipient!
    {
      title: 'Physical Therapy Session',
      category: 'Personal Care',
      caregiverId: priya._id,
      startTime: createDateAt(1, 14, 0), // Tomorrow 2:00 PM - 3:30 PM
      endTime: createDateAt(1, 15, 30),
      status: 'Scheduled',
      location: 'Home Living Room',
      notes: 'Focus on balance and stair step-ups',
      hasConflict: true,
      tasks: [
        { description: 'Warm-up knee flexion on exercise mat', isCompleted: false },
        { description: '5 min stair climbing with safety belt', isCompleted: false },
        { description: 'Apply ice pack to knee for 15 mins post-workout', isCompleted: false },
      ],
    },
    {
      title: 'Afternoon Grocery Delivery & Pantry Setup',
      category: 'Grocery & Meals',
      caregiverId: david._id,
      startTime: createDateAt(1, 14, 30), // Tomorrow 2:30 PM - 4:00 PM (OVERLAPS with Priya 2:00-3:30!)
      endTime: createDateAt(1, 16, 0),
      status: 'Scheduled',
      location: 'Home Kitchen',
      notes: 'Deliberate conflict demonstration: 30-minute overlap with Priya',
      hasConflict: true,
      tasks: [
        { description: 'Receive refrigerated grocery delivery', isCompleted: false },
        { description: 'Put perishables immediately in fridge', isCompleted: false },
      ],
    },

    // DELIBERATE CONFLICT 2: Same caregiver Priya double-booked across 2 slots in day 2
    {
      title: 'Medication Review & Vital Check',
      category: 'Medication Reminder',
      caregiverId: priya._id,
      startTime: createDateAt(2, 10, 0), // Day +2, 10:00 - 11:30 AM
      endTime: createDateAt(2, 11, 30),
      status: 'Scheduled',
      location: 'Home',
      notes: 'Check pulse oximeter readings and resting heart rate',
      hasConflict: true,
      tasks: [
        { description: 'Log resting heart rate and O2 saturation', isCompleted: false },
        { description: 'Inspect skin around surgical incision', isCompleted: false },
      ],
    },
    {
      title: 'Urgent Prescription Pick-up & Delivery',
      category: 'Transport & Appointments',
      caregiverId: priya._id,
      startTime: createDateAt(2, 10, 30), // Day +2, 10:30 - 12:00 PM (Double booking for Priya!)
      endTime: createDateAt(2, 12, 0),
      status: 'Scheduled',
      location: 'CVS Pharmacy & Home',
      notes: 'Deliberate conflict demonstration: Priya double-booked from 10:30 to 11:30',
      hasConflict: true,
      tasks: [
        { description: 'Pick up anti-inflammatory refill at CVS', isCompleted: false },
      ],
    },

    // === NEXT WEEK (Days +4 to +10) - Scheduled forward visits ===
    {
      title: 'Garden Walk & Floral Care',
      category: 'Companionship',
      caregiverId: sarah._id,
      startTime: createDateAt(4, 15, 0),
      endTime: createDateAt(4, 16, 30),
      status: 'Scheduled',
      location: 'Backyard Garden',
      notes: 'Inspect Eleanor’s tomato plants and potted orchids',
      tasks: [
        { description: 'Help Eleanor with walking cane in garden', isCompleted: false },
        { description: 'Water indoor ferns and patio orchids', isCompleted: false },
      ],
    },
    {
      title: 'Weekly Meal Prep (Batch Soups)',
      category: 'Grocery & Meals',
      caregiverId: david._id,
      startTime: createDateAt(6, 11, 0),
      endTime: createDateAt(6, 13, 30),
      status: 'Scheduled',
      location: 'Home Kitchen',
      notes: 'Make vegetable minestrone and portion into freezer containers',
      tasks: [
        { description: 'Chop carrots, celery, and zucchini', isCompleted: false },
        { description: 'Cook pot of low-sodium minestrone soup', isCompleted: false },
        { description: 'Label and date freezer safe containers', isCompleted: false },
      ],
    },
    {
      title: 'Bi-Weekly Podiatrist Check',
      category: 'Transport & Appointments',
      caregiverId: priya._id,
      startTime: createDateAt(8, 13, 30),
      endTime: createDateAt(8, 15, 30),
      status: 'Scheduled',
      location: 'Springfield Foot & Ankle Clinic',
      notes: 'Routine nail trim and diabetic foot inspection',
      tasks: [
        { description: 'Assist with footwear and transport', isCompleted: false },
        { description: 'Confirm follow-up appointment in 6 weeks', isCompleted: false },
      ],
    },
  ];

  console.log('[Seed] Inserting visits and associated tasks...');
  for (const item of visitTemplates) {
    const { tasks, ...visitData } = item;
    const visit = await Visit.create({
      circleId: circle._id,
      ...visitData,
    });

    if (tasks && tasks.length > 0) {
      const taskDocs = tasks.map((t) => ({
        visitId: visit._id,
        circleId: circle._id,
        description: t.description,
        isCompleted: t.isCompleted || false,
        completedAt: t.isCompleted ? new Date(visit.startTime.getTime() + 45 * 60000) : null,
        completedBy: t.completedBy || null,
      }));
      await Task.insertMany(taskDocs);
    }
  }

  // Recalculate and connect all conflict references
  console.log('[Seed] Calculating conflict graphs and linking bidirectional conflictWith IDs...');
  await syncVisitConflicts(circle._id);

  console.log('[Seed] Populating initial activity logs...');
  const activityEntries = [
    {
      circleId: circle._id,
      action: 'CIRCLE_CREATED',
      performedBy: sarah._id,
      details: 'Sarah Jenkins created "Eleanor Vance Care Circle"',
      timestamp: new Date(Date.now() - 25 * dayMs),
    },
    {
      circleId: circle._id,
      action: 'MEMBER_ADDED',
      performedBy: sarah._id,
      details: 'Sarah added David Miller as Caregiver',
      timestamp: new Date(Date.now() - 24 * dayMs),
    },
    {
      circleId: circle._id,
      action: 'MEMBER_ADDED',
      performedBy: sarah._id,
      details: 'Sarah added Priya Sharma as Caregiver',
      timestamp: new Date(Date.now() - 20 * dayMs),
    },
    {
      circleId: circle._id,
      action: 'VISIT_CREATED',
      performedBy: sarah._id,
      details: 'Sarah scheduled "Doctor Follow-Up Transport"',
      timestamp: new Date(Date.now() - 6 * dayMs),
    },
    {
      circleId: circle._id,
      action: 'TASK_COMPLETED',
      performedBy: priya._id,
      details: 'Priya completed task "15 min gentle quad and ankle stretches"',
      timestamp: new Date(Date.now() - 9 * dayMs),
    },
    {
      circleId: circle._id,
      action: 'CONFLICT_FLAGGED',
      performedBy: david._id,
      details: 'David scheduled "Afternoon Grocery Delivery" with conflict warning (overlapping with Priya)',
      timestamp: new Date(Date.now() - 1 * dayMs),
    },
  ];

  await ActivityLog.insertMany(activityEntries);

  console.log('[Seed] Creating initial cached AI weekly summary...');
  await AiSummary.create({
    circleId: circle._id,
    type: 'weekly_summary',
    content: {
      summary: `### Eleanor Vance Care Circle: Weekly Care Coordination Summary
*Week of ${new Date(Date.now() - 7 * dayMs).toLocaleDateString()} to ${new Date().toLocaleDateString()}*

#### 1. Weekly Overview
The care circle demonstrated outstanding coordination this past week with 5 scheduled visits completed reliably. Eleanor maintained consistent routine adherence and experienced notable improvements in knee mobility following her orthopedic review.

#### 2. Key Care Highlights
- **Mobility & Physical Therapy**: Eleanor completed 15 minutes of guided quad stretches with Priya and safely navigated garden walks.
- **Nutrition & Household**: David ensured the pantry is stocked with heart-healthy, low-sodium groceries and fresh produce.
- **Clinical Follow-up**: Dr. Hughes confirmed excellent bone healing at the 6-week post-op checkup and approved progressive reduction in walker dependency.

#### 3. Attention & Action Items
- **Upcoming Conflicts**: Two overlapping time windows are scheduled for tomorrow afternoon (Physical Therapy vs Grocery Delivery). Circle members should review and adjust timings to give Eleanor adequate rest between visits.
- **Medication Refills**: Refill prescription pill organizer during the morning tidy visit.

#### 4. Circle Appreciation
Special thanks to Sarah, David, and Priya for ensuring seamless, gentle support throughout Eleanor's recovery!`,
    },
    startDate: new Date(Date.now() - 7 * dayMs),
    endDate: now,
    generatedAt: new Date(Date.now() - 2 * 3600000), // 2 hours ago
  });

  console.log('----------------------------------------------------');
  console.log('✅ Demo database seeded successfully!');
  console.log(`Care Circle: "${circle.name}" (${circle._id})`);
  console.log('Demo Accounts:');
  console.log('  Family Admin: sarah@carevisit.demo / Password123!');
  console.log('  Caregiver:    david@carevisit.demo / Password123!');
  console.log('  Caregiver:    priya@carevisit.demo / Password123!');
  console.log('  Viewer:       robert@carevisit.demo / Password123!');
  console.log('----------------------------------------------------');
};

// If executed directly via CLI
if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase()
    .then(async () => {
      await disconnectDB();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('[Seed Error]:', err);
      await disconnectDB();
      process.exit(1);
    });
}
