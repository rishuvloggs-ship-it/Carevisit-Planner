import bcrypt from 'bcryptjs';

// Pre-computed bcrypt hash for 'Password123!'
const DEMO_PASSWORD_HASH = '$2a$10$4cOZkVVC/R9GisO4TQ4YGub6j0Qtd8R70TtWIXSaidkni5M8czJCm';

const sarahId = '6af0510d2b5c98b502cf0001';
const davidId = '6af0510d2b5c98b502cf0002';
const priyaId = '6af0510d2b5c98b502cf0003';
const robertId = '6af0510d2b5c98b502cf0004';
const circleId = '6af0510d2b5c98b502cf1396';

const users = [
  {
    _id: sarahId,
    name: 'Sarah Jenkins',
    email: 'sarah@carevisit.demo',
    passwordHash: DEMO_PASSWORD_HASH,
    phone: '+1 (555) 234-5678',
    avatarColor: '#3B82F6',
  },
  {
    _id: davidId,
    name: 'David Miller',
    email: 'david@carevisit.demo',
    passwordHash: DEMO_PASSWORD_HASH,
    phone: '+1 (555) 876-5432',
    avatarColor: '#10B981',
  },
  {
    _id: priyaId,
    name: 'Priya Sharma',
    email: 'priya@carevisit.demo',
    passwordHash: DEMO_PASSWORD_HASH,
    phone: '+1 (555) 345-6789',
    avatarColor: '#8B5CF6',
  },
  {
    _id: robertId,
    name: 'Robert Vance',
    email: 'robert@carevisit.demo',
    passwordHash: DEMO_PASSWORD_HASH,
    phone: '+1 (555) 456-7890',
    avatarColor: '#F59E0B',
  },
];

const careCircle = {
  _id: circleId,
  name: 'Eleanor Vance Care Circle',
  careRecipient: {
    name: 'Eleanor Vance',
    notes:
      'Age 78. Recovering from left knee replacement. Low sodium diet. Enjoys chamomile tea at 3 PM and classical music. Primary Physician: Dr. Robert Hughes (555-0192).',
    address: '42 Elmwood Terrace, Springfield, IL',
  },
  members: [
    { userId: users[0], role: 'Family Admin', joinedAt: new Date(Date.now() - 25 * 86400000) },
    { userId: users[1], role: 'Caregiver', joinedAt: new Date(Date.now() - 24 * 86400000) },
    { userId: users[2], role: 'Caregiver', joinedAt: new Date(Date.now() - 20 * 86400000) },
    { userId: users[3], role: 'Viewer', joinedAt: new Date(Date.now() - 15 * 86400000) },
  ],
};

const dayMs = 86400000;
const now = new Date();
const createDateAt = (dayOffset, hours, minutes = 0) => {
  const d = new Date(now.getTime() + dayOffset * dayMs);
  d.setHours(hours, minutes, 0, 0);
  return d;
};

let visits = [
  {
    _id: 'v_past_1',
    circleId: circleId,
    caregiverId: users[0],
    title: 'Morning Medication & Breakfast',
    category: 'Medication Reminder',
    startTime: createDateAt(-10, 8, 30),
    endTime: createDateAt(-10, 10, 0),
    status: 'Completed',
    location: 'Home',
    notes: 'Ensure blood pressure pill is taken with oatmeal',
    completedNotes: 'Eleanor was in great spirits. Oatmeal finished, BP normal (122/78).',
    hasConflict: false,
    conflictWith: [],
  },
  {
    _id: 'v_past_2',
    circleId: circleId,
    caregiverId: users[2],
    title: 'Knee Mobility & Afternoon Tea',
    category: 'Personal Care',
    startTime: createDateAt(-9, 14, 0),
    endTime: createDateAt(-9, 15, 30),
    status: 'Completed',
    location: 'Home',
    notes: 'PT prescribed gentle quad stretches',
    completedNotes: 'Completed 15 minutes of seated leg lifts. Eleanor walked around the garden with walker.',
    hasConflict: false,
    conflictWith: [],
  },
  {
    _id: 'v_past_3',
    circleId: circleId,
    caregiverId: users[1],
    title: 'Weekly Grocery Stock & Pantry Check',
    category: 'Grocery & Meals',
    startTime: createDateAt(-7, 11, 0),
    endTime: createDateAt(-7, 13, 0),
    status: 'Completed',
    location: 'Trader Joe’s & Home',
    notes: 'Buy low sodium broth, fresh spinach, and almond milk',
    completedNotes: 'Pantry fully restocked. Put away milk and fresh produce.',
    hasConflict: false,
    conflictWith: [],
  },
  {
    _id: 'v_past_4',
    circleId: circleId,
    caregiverId: users[0],
    title: 'Doctor Follow-Up Transport',
    category: 'Transport & Appointments',
    startTime: createDateAt(-5, 10, 0),
    endTime: createDateAt(-5, 12, 30),
    status: 'Completed',
    location: 'St. Jude Orthopedic Clinic',
    notes: 'Dr. Hughes 6-week post-op checkup',
    completedNotes: 'Dr. Hughes confirmed bone healing is excellent. Approved gradual reduction of walker use.',
    hasConflict: false,
    conflictWith: [],
  },
  {
    _id: 'v_past_5',
    circleId: circleId,
    caregiverId: users[1],
    title: 'Evening Companionship & Scrabble',
    category: 'Companionship',
    startTime: createDateAt(-3, 17, 30),
    endTime: createDateAt(-3, 19, 0),
    status: 'Completed',
    location: 'Home',
    notes: 'Keep mind engaged with word games',
    completedNotes: 'Played 2 rounds of Scrabble. She won the second round!',
    hasConflict: false,
    conflictWith: [],
  },
  {
    _id: 'v_today_1',
    circleId: circleId,
    caregiverId: users[0],
    title: 'Morning Check-in & Light Tidy',
    category: 'Light Household Help',
    startTime: createDateAt(0, 9, 0),
    endTime: createDateAt(0, 10, 30),
    status: 'In Progress',
    location: 'Home',
    notes: 'Fold clean laundry and check heating thermostat',
    hasConflict: false,
    conflictWith: [],
  },
  // DELIBERATE CONFLICT 1: Overlapping visits tomorrow
  {
    _id: 'v_conflict_1',
    circleId: circleId,
    caregiverId: users[2],
    title: 'Physical Therapy Session',
    category: 'Personal Care',
    startTime: createDateAt(1, 14, 0),
    endTime: createDateAt(1, 15, 30),
    status: 'Scheduled',
    location: 'Home Living Room',
    notes: 'Focus on balance and stair step-ups',
    hasConflict: true,
    conflictWith: ['v_conflict_2'],
  },
  {
    _id: 'v_conflict_2',
    circleId: circleId,
    caregiverId: users[1],
    title: 'Afternoon Grocery Delivery & Pantry Setup',
    category: 'Grocery & Meals',
    startTime: createDateAt(1, 14, 30),
    endTime: createDateAt(1, 16, 0),
    status: 'Scheduled',
    location: 'Home Kitchen',
    notes: 'Deliberate conflict demonstration: 30-minute overlap with Priya',
    hasConflict: true,
    conflictWith: ['v_conflict_1'],
  },
  // DELIBERATE CONFLICT 2: Same caregiver double-booked
  {
    _id: 'v_conflict_3',
    circleId: circleId,
    caregiverId: users[2],
    title: 'Medication Review & Vital Check',
    category: 'Medication Reminder',
    startTime: createDateAt(2, 10, 0),
    endTime: createDateAt(2, 11, 30),
    status: 'Scheduled',
    location: 'Home',
    notes: 'Check pulse oximeter readings and resting heart rate',
    hasConflict: true,
    conflictWith: ['v_conflict_4'],
  },
  {
    _id: 'v_conflict_4',
    circleId: circleId,
    caregiverId: users[2],
    title: 'Urgent Prescription Pick-up & Delivery',
    category: 'Transport & Appointments',
    startTime: createDateAt(2, 10, 30),
    endTime: createDateAt(2, 12, 0),
    status: 'Scheduled',
    location: 'CVS Pharmacy & Home',
    notes: 'Deliberate conflict demonstration: Priya double-booked',
    hasConflict: true,
    conflictWith: ['v_conflict_3'],
  },
  {
    _id: 'v_next_1',
    circleId: circleId,
    caregiverId: users[0],
    title: 'Garden Walk & Floral Care',
    category: 'Companionship',
    startTime: createDateAt(4, 15, 0),
    endTime: createDateAt(4, 16, 30),
    status: 'Scheduled',
    location: 'Backyard Garden',
    notes: 'Inspect Eleanor’s tomato plants and potted orchids',
    hasConflict: false,
    conflictWith: [],
  },
  {
    _id: 'v_next_2',
    circleId: circleId,
    caregiverId: users[1],
    title: 'Weekly Meal Prep (Batch Soups)',
    category: 'Grocery & Meals',
    startTime: createDateAt(6, 11, 0),
    endTime: createDateAt(6, 13, 30),
    status: 'Scheduled',
    location: 'Home Kitchen',
    notes: 'Make vegetable minestrone and portion into freezer containers',
    hasConflict: false,
    conflictWith: [],
  },
];

let tasks = [
  { _id: 't_1', visitId: 'v_past_1', circleId, description: 'Help prepare warm oatmeal and sliced banana', isCompleted: true, completedAt: createDateAt(-10, 9, 15), completedBy: users[0] },
  { _id: 't_2', visitId: 'v_past_1', circleId, description: 'Administer morning prescription with water', isCompleted: true, completedAt: createDateAt(-10, 9, 30), completedBy: users[0] },
  { _id: 't_3', visitId: 'v_past_1', circleId, description: 'Record resting blood pressure in health log', isCompleted: true, completedAt: createDateAt(-10, 9, 45), completedBy: users[0] },
  { _id: 't_4', visitId: 'v_past_2', circleId, description: '15 min gentle quad and ankle stretches', isCompleted: true, completedAt: createDateAt(-9, 14, 30), completedBy: users[2] },
  { _id: 't_5', visitId: 'v_past_2', circleId, description: 'Serve chamomile tea with crackers', isCompleted: true, completedAt: createDateAt(-9, 15, 0), completedBy: users[2] },
  { _id: 't_6', visitId: 'v_past_2', circleId, description: 'Ensure walker rubber stoppers are clean', isCompleted: true, completedAt: createDateAt(-9, 15, 15), completedBy: users[2] },
  { _id: 't_7', visitId: 'v_today_1', circleId, description: 'Fold and stow bedroom laundry', isCompleted: true, completedAt: createDateAt(0, 9, 45), completedBy: users[0] },
  { _id: 't_8', visitId: 'v_today_1', circleId, description: 'Refill 7-day pill organizer for next week', isCompleted: false, completedAt: null, completedBy: null },
  { _id: 't_9', visitId: 'v_today_1', circleId, description: 'Inspect bathroom grab rails for stability', isCompleted: true, completedAt: createDateAt(0, 10, 10), completedBy: users[0] },
  { _id: 't_10', visitId: 'v_conflict_1', circleId, description: 'Warm-up knee flexion on exercise mat', isCompleted: false, completedAt: null, completedBy: null },
  { _id: 't_11', visitId: 'v_conflict_1', circleId, description: '5 min stair climbing with safety belt', isCompleted: false, completedAt: null, completedBy: null },
  { _id: 't_12', visitId: 'v_conflict_2', circleId, description: 'Receive refrigerated grocery delivery', isCompleted: false, completedAt: null, completedBy: null },
  { _id: 't_13', visitId: 'v_conflict_2', circleId, description: 'Put perishables immediately in fridge', isCompleted: false, completedAt: null, completedBy: null },
];

let activityLogs = [
  { _id: 'act_1', circleId, action: 'CIRCLE_CREATED', performedBy: users[0], details: 'Sarah Jenkins created "Eleanor Vance Care Circle"', timestamp: new Date(Date.now() - 25 * dayMs) },
  { _id: 'act_2', circleId, action: 'MEMBER_ADDED', performedBy: users[0], details: 'Sarah added David Miller as Caregiver', timestamp: new Date(Date.now() - 24 * dayMs) },
  { _id: 'act_3', circleId, action: 'MEMBER_ADDED', performedBy: users[0], details: 'Sarah added Priya Sharma as Caregiver', timestamp: new Date(Date.now() - 20 * dayMs) },
  { _id: 'act_4', circleId, action: 'TASK_COMPLETED', performedBy: users[2], details: 'Priya completed task "15 min gentle quad and ankle stretches"', timestamp: new Date(Date.now() - 9 * dayMs) },
  { _id: 'act_5', circleId, action: 'CONFLICT_FLAGGED', performedBy: users[1], details: 'David scheduled "Afternoon Grocery Delivery" with conflict warning (overlapping with Priya)', timestamp: new Date(Date.now() - 1 * dayMs) },
];

export const mockStore = {
  users,
  careCircle,
  visits,
  tasks,
  activityLogs,

  findUserByEmail(email) {
    return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  findUserById(id) {
    return users.find((u) => u._id.toString() === id.toString()) || null;
  },

  createUser({ name, email, passwordHash, phone, avatarColor }) {
    const newUser = {
      _id: 'u_' + Date.now(),
      name,
      email: email.toLowerCase(),
      passwordHash,
      phone: phone || '',
      avatarColor: avatarColor || '#3B82F6',
    };
    users.push(newUser);
    return newUser;
  },

  getCirclesForUser(userId) {
    return [careCircle];
  },

  getCircleById(id) {
    return careCircle;
  },

  getVisits(circleIdVal, filters = {}) {
    let result = visits.filter((v) => v.circleId.toString() === circleIdVal.toString());
    if (filters.caregiverId) {
      result = result.filter(
        (v) => (v.caregiverId?._id || v.caregiverId).toString() === filters.caregiverId.toString()
      );
    }
    if (filters.status) {
      result = result.filter((v) => v.status === filters.status);
    }
    return result.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  },

  getVisitById(id) {
    const v = visits.find((item) => item._id.toString() === id.toString());
    if (!v) return null;
    const vTasks = tasks.filter((t) => t.visitId.toString() === v._id.toString());
    return { ...v, tasks: vTasks };
  },

  createVisit(visitData) {
    const newV = {
      _id: 'v_' + Date.now(),
      ...visitData,
      caregiverId: users.find((u) => u._id === visitData.caregiverId) || visitData.caregiverId,
    };
    visits.push(newV);
    return newV;
  },

  updateVisit(id, updateData) {
    const idx = visits.findIndex((v) => v._id.toString() === id.toString());
    if (idx === -1) return null;
    visits[idx] = { ...visits[idx], ...updateData };
    return visits[idx];
  },

  deleteVisit(id) {
    visits = visits.filter((v) => v._id.toString() !== id.toString());
    tasks = tasks.filter((t) => t.visitId.toString() !== id.toString());
    return true;
  },

  getTasksForVisit(visitId) {
    return tasks.filter((t) => t.visitId.toString() === visitId.toString());
  },

  toggleTask(taskId, isCompleted, user) {
    const t = tasks.find((item) => item._id.toString() === taskId.toString());
    if (!t) return null;
    t.isCompleted = isCompleted;
    t.completedAt = isCompleted ? new Date() : null;
    t.completedBy = isCompleted ? user : null;
    return t;
  },

  addTask(taskData) {
    const newT = {
      _id: 't_' + Date.now(),
      ...taskData,
      isCompleted: false,
    };
    tasks.push(newT);
    return newT;
  },

  deleteTask(taskId) {
    tasks = tasks.filter((t) => t._id.toString() !== taskId.toString());
    return true;
  },
};
