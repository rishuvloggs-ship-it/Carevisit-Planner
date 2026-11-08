import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

const getModelName = () => {
  return process.env.GEMINI_MODEL || 'gemini-3.8-flash';
};

const SYSTEM_INSTRUCTION_BASE = `
You are the AI assistant for CareVisit Planner, a non-emergency caregiver visit coordination tool.
IMPORTANT SAFETY INSTRUCTIONS:
- You MUST NOT give any medical advice, clinical diagnoses, drug dosage modifications, or treatment recommendations.
- Keep output objective, supportive, and focused strictly on scheduling, logistical tasks, companionship, and routine coordination.
- Always output clean, valid JSON when JSON is requested.
`;

// Helper: Call Gemini with 1 retry on 503 transient spike
const callGeminiWithRetry = async (ai, options) => {
  try {
    return await ai.models.generateContent(options);
  } catch (err) {
    if (err.message?.includes('503') || err.message?.includes('429')) {
      console.warn('[Gemini AI] Temporary 503/429 demand spike detected. Retrying once after 1.5s...');
      await new Promise((r) => setTimeout(r, 1500));
      return await ai.models.generateContent(options);
    }
    throw err;
  }
};

// Zod schemas for structured AI validation
export const parsedVisitSchema = z.object({
  title: z.string().min(1),
  caregiverName: z.string().optional().default(''),
  date: z.string(), // YYYY-MM-DD
  startTime: z.string(), // ISO string or HH:mm
  endTime: z.string(), // ISO string or HH:mm
  category: z.string().default('General Check-in'),
  location: z.string().default('Home'),
  tasks: z.array(z.string()).default([]),
  confidenceNotes: z.string().optional(),
});

export const suggestedSlotsSchema = z.object({
  suggestions: z.array(
    z.object({
      startTime: z.string(),
      endTime: z.string(),
      reason: z.string(),
    })
  ).min(1).max(4),
});

/**
 * Fallback parser when Gemini is unreachable or experiencing a 503 spike
 */
const fallbackParseVisit = (text, caregivers, recipientName) => {
  const lower = text.toLowerCase();
  
  // Match caregiver
  let matchedCaregiver = '';
  for (const c of caregivers) {
    if (c.name && lower.includes(c.name.toLowerCase().split(' ')[0])) {
      matchedCaregiver = c.name;
      break;
    }
  }

  // Detect category
  let category = 'General Check-in';
  if (lower.includes('clinic') || lower.includes('doctor') || lower.includes('appointment')) {
    category = 'Transport & Appointments';
  } else if (lower.includes('grocery') || lower.includes('food') || lower.includes('pantry') || lower.includes('cook')) {
    category = 'Grocery & Meals';
  } else if (lower.includes('medicine') || lower.includes('pill') || lower.includes('medication')) {
    category = 'Medication Reminder';
  } else if (lower.includes('clean') || lower.includes('tidy') || lower.includes('laundry')) {
    category = 'Light Household Help';
  } else if (lower.includes('stretch') || lower.includes('pt') || lower.includes('therapy')) {
    category = 'Personal Care';
  } else if (lower.includes('tea') || lower.includes('game') || lower.includes('walk')) {
    category = 'Companionship';
  }

  // Compute timing
  const now = new Date();
  const targetDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // default tomorrow
  targetDate.setHours(14, 0, 0, 0);
  const targetEndDate = new Date(targetDate.getTime() + 60 * 60 * 1000);

  // Extract tasks
  const tasks = [];
  if (lower.includes('medicine') || lower.includes('medicines')) tasks.push('Pick up prescription medicines');
  if (lower.includes('clinic') || lower.includes('doctor')) tasks.push(`Transport ${recipientName} to appointment`);
  if (lower.includes('grocery')) tasks.push('Purchase needed groceries and stock pantry');
  if (tasks.length === 0) tasks.push('General companionship and wellness check-in');

  return {
    title: text.length > 50 ? text.slice(0, 47) + '...' : text,
    caregiverName: matchedCaregiver,
    date: targetDate.toISOString().split('T')[0],
    startTime: targetDate.toISOString(),
    endTime: targetEndDate.toISOString(),
    category,
    location: lower.includes('clinic') ? 'Medical Clinic' : 'Home',
    tasks,
    confidenceNotes: 'Parsed with intelligent fallback assistant (Gemini temporary high demand).',
  };
};

/**
 * 1. Smart Visit Entry: parse natural language into structured visit fields
 */
export const parseVisitNaturalLanguage = async ({ text, caregivers = [], recipientName = 'Care Recipient' }) => {
  const ai = getGeminiClient();
  if (!ai) {
    return {
      success: true,
      data: fallbackParseVisit(text, caregivers, recipientName),
      fallback: true,
    };
  }

  const caregiverList = caregivers.map((c) => c.name).join(', ') || 'None provided';
  const todayStr = new Date().toISOString().split('T')[0];
  const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  const prompt = `
${SYSTEM_INSTRUCTION_BASE}

Task: Parse the following caregiver visit description into structured JSON.
Current date reference: Today is ${dayOfWeek}, ${todayStr}.
Care recipient name: ${recipientName}
Known authorized caregivers: [${caregiverList}]

User text: "${text}"

Respond with ONLY valid JSON strictly matching this structure:
{
  "title": "A short, descriptive visit title",
  "caregiverName": "Matched caregiver name from known caregivers if mentioned, or empty string",
  "date": "YYYY-MM-DD",
  "startTime": "YYYY-MM-DDTHH:mm:00.000Z or ISO string",
  "endTime": "YYYY-MM-DDTHH:mm:00.000Z or ISO string",
  "category": "One of: Companionship, Grocery & Meals, Medication Reminder, Light Household Help, Transport & Appointments, Personal Care, General Check-in",
  "location": "Location mentioned (default Home)",
  "tasks": ["Array", "of", "specific", "actionable", "tasks"],
  "confidenceNotes": "Brief explanation of inferred timing"
}
`;

  try {
    const response = await callGeminiWithRetry(ai, {
      model: getModelName(),
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text?.trim() || '{}';
    const jsonParsed = JSON.parse(rawText);
    const validated = parsedVisitSchema.parse(jsonParsed);

    return {
      success: true,
      data: validated,
    };
  } catch (err) {
    console.warn('[Gemini AI] Falling back to intelligent local parser:', err.message);
    return {
      success: true,
      data: fallbackParseVisit(text, caregivers, recipientName),
      fallback: true,
      note: 'Processed via assistant fallback due to Gemini API temporary spike.',
    };
  }
};

/**
 * 2. Conflict Resolution Suggestions
 */
export const suggestAlternativeSlots = async ({ desiredDurationMinutes, busySlots = [], targetDate }) => {
  const duration = desiredDurationMinutes || 60;
  const ai = getGeminiClient();

  const generateFallbackSlots = () => {
    const d = new Date(targetDate || new Date());
    const makeSlot = (h, m) => {
      const s = new Date(d);
      s.setHours(h, m, 0, 0);
      const e = new Date(s.getTime() + duration * 60 * 1000);
      return {
        startTime: s.toISOString(),
        endTime: e.toISOString(),
        reason: `${h > 12 ? h - 12 : h}:${m === 0 ? '00' : m} ${h >= 12 ? 'PM' : 'AM'} daytime slot with buffer between visits`,
      };
    };

    return [makeSlot(10, 0), makeSlot(14, 0), makeSlot(16, 30)];
  };

  if (!ai) {
    return {
      success: true,
      data: generateFallbackSlots(),
    };
  }

  const prompt = `
${SYSTEM_INSTRUCTION_BASE}

Task: You are an intelligent scheduling assistant.
A scheduling conflict occurred on date: ${targetDate}.
Requested visit duration: ${duration} minutes.

Existing busy intervals on this day (anonymized):
${JSON.stringify(busySlots, null, 2)}

Provide 2 to 3 alternative, conflict-free time slots on ${targetDate} during standard daytime hours (08:30 to 18:30) that do not overlap with any busy intervals.

Return ONLY valid JSON matching:
{
  "suggestions": [
    {
      "startTime": "ISO 8601 string",
      "endTime": "ISO 8601 string",
      "reason": "Why this time works (e.g. 1 hour after morning visit)"
    }
  ]
}
`;

  try {
    const response = await callGeminiWithRetry(ai, {
      model: getModelName(),
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text?.trim() || '{}';
    const jsonParsed = JSON.parse(rawText);
    const validated = suggestedSlotsSchema.parse(jsonParsed);

    return {
      success: true,
      data: validated.suggestions,
    };
  } catch (err) {
    console.warn('[Gemini AI] Using fallback alternative slot generator:', err.message);
    return {
      success: true,
      data: generateFallbackSlots(),
      fallback: true,
    };
  }
};

/**
 * 3. Weekly Care Summary
 */
export const generateWeeklyCareSummary = async ({
  recipientName,
  startDate,
  endDate,
  visitStats,
  completedTasks = [],
  missedTasks = [],
  notesSummary = [],
}) => {
  const ai = getGeminiClient();

  const generateFallbackSummary = () => {
    return `### ${recipientName} Care Circle: Weekly Care Coordination Summary
*Period: ${startDate} to ${endDate}*

#### 1. Weekly Overview
During this past week, the care circle scheduled a total of **${visitStats.total} visits**, with **${visitStats.completed} visits successfully completed**. The circle maintained steady coordination for ${recipientName}.

#### 2. Key Care Highlights
- **Task Execution**: Caregivers completed **${visitStats.completedTasks} of ${visitStats.totalTasks} logged tasks** (${visitStats.completionRate}% completion rate).
- **Core Activities**: Routines included medication reminders, companion visits, grocery prep, and mobility support.
${completedTasks.length > 0 ? `- **Sample Completed Tasks**: ${completedTasks.slice(0, 4).join('; ')}` : ''}

#### 3. Follow-ups & Attention Needed
${missedTasks.length > 0 ? `- **Pending Items**: ${missedTasks.slice(0, 3).join(', ')}` : '- All core scheduled checklist tasks for this window were completed.'}
- Review the upcoming calendar for any overlapping caregiver appointments.

#### 4. Caregiver Appreciation
Special appreciation to all participating circle members for their thoughtful attention and shared responsibility!`;
  };

  if (!ai) {
    return {
      success: true,
      data: {
        summary: generateFallbackSummary(),
        generatedAt: new Date(),
      },
    };
  }

  const prompt = `
${SYSTEM_INSTRUCTION_BASE}

Task: Produce a warm, reassuring, plain-language weekly care coordination summary for family members.
Care Recipient: ${recipientName}
Week: ${startDate} to ${endDate}

Aggregated Weekly Data:
- Visits Scheduled: ${visitStats.total}
- Visits Completed: ${visitStats.completed}
- Visits Missed / Cancelled: ${visitStats.missedOrCancelled}
- Total Tasks Logged: ${visitStats.totalTasks}
- Tasks Completed: ${visitStats.completedTasks} (${visitStats.completionRate}%)
- Sample Completed Tasks: ${JSON.stringify(completedTasks.slice(0, 10))}
- Missed / Incomplete Tasks: ${JSON.stringify(missedTasks.slice(0, 8))}
- Caregiver Observations & Notes: ${JSON.stringify(notesSummary.slice(0, 6))}

Write a structured markdown report including:
1. **Weekly Overview**: 2-3 sentences summarizing overall visit consistency.
2. **Key Care Highlights**: Bullet points on companionship, errands, meals, or completed routines.
3. **Follow-ups & Attention Needed**: Any pending tasks or recurring schedule notes.
4. **Caregiver Appreciation**: Brief note acknowledging the circle's joint effort.

REMINDER: DO NOT offer medical diagnoses, therapy changes, or clinical judgements. Keep tone positive, organized, and helpful.
`;

  try {
    const response = await callGeminiWithRetry(ai, {
      model: getModelName(),
      contents: prompt,
    });

    return {
      success: true,
      data: {
        summary: response.text,
        generatedAt: new Date(),
      },
    };
  } catch (err) {
    console.warn('[Gemini AI] Using fallback weekly care summary generator:', err.message);
    return {
      success: true,
      data: {
        summary: generateFallbackSummary(),
        generatedAt: new Date(),
      },
      fallback: true,
    };
  }
};

/**
 * 4. Handover Notes Polisher
 */
export const polishHandoverNote = async ({ roughNotes, visitTitle, recipientName }) => {
  const ai = getGeminiClient();

  const generateFallbackHandover = () => {
    return `**Visit Summary**: Caregiver completed ${visitTitle} for ${recipientName}.
**Key Observations**: ${roughNotes}
**Next Caregiver Heads-Up**: Please check that ${recipientName} has fresh water nearby, review the checklist, and confirm next scheduled visit time.`;
  };

  if (!ai) {
    return {
      success: true,
      data: {
        polishedNote: generateFallbackHandover(),
      },
    };
  }

  const prompt = `
${SYSTEM_INSTRUCTION_BASE}

Task: Convert the caregiver's rough visit notes into a clear, polite, and well-structured handover note for the next caregiver visiting ${recipientName}.
Visit: ${visitTitle}
Caregiver's rough notes: "${roughNotes}"

Format:
- **Visit Summary**: 1-2 concise sentences
- **Key Completed Actions**: Bullet points
- **Next Caregiver Heads-Up**: What the next caregiver should check or remember (e.g. snack in fridge, laundry drying, hydration)

Keep it non-clinical, practical, and under 150 words.
`;

  try {
    const response = await callGeminiWithRetry(ai, {
      model: getModelName(),
      contents: prompt,
    });

    return {
      success: true,
      data: {
        polishedNote: response.text,
      },
    };
  } catch (err) {
    console.warn('[Gemini AI] Using fallback handover note polisher:', err.message);
    return {
      success: true,
      data: {
        polishedNote: generateFallbackHandover(),
      },
      fallback: true,
    };
  }
};
