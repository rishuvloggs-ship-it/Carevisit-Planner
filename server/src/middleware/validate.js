import { z } from 'zod';

export const validateRequest = (schema) => (req, res, next) => {
  try {
    const parsed = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!parsed.success) {
      const errorDetails = parsed.error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return res.status(400).json({
        success: false,
        message: errorDetails[0]?.message || 'Validation error',
        errors: errorDetails,
      });
    }

    req.validated = parsed.data;
    next();
  } catch (err) {
    next(err);
  }
};

// Validation Schemas
export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Valid email address is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    phone: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email address is required'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const createCircleSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Circle name must be at least 2 characters'),
    careRecipient: z.object({
      name: z.string().min(2, 'Care recipient name must be at least 2 characters'),
      notes: z.string().optional().default(''),
      address: z.string().optional().default(''),
    }),
  }),
});

export const addMemberSchema = z.object({
  body: z.object({
    email: z.string().email('Valid caregiver email is required'),
    role: z.enum(['Family Admin', 'Caregiver', 'Viewer']).default('Caregiver'),
  }),
});

export const visitSchema = z.object({
  body: z.object({
    circleId: z.string().optional(),
    caregiverId: z.string().min(1, 'Caregiver ID is required'),
    title: z.string().min(2, 'Title must be at least 2 characters'),
    category: z.string().optional(),
    startTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Valid start time is required',
    }),
    endTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Valid end time is required',
    }),
    location: z.string().optional().default('Home'),
    notes: z.string().optional().default(''),
    status: z
      .enum(['Scheduled', 'In Progress', 'Completed', 'Missed', 'Cancelled'])
      .optional()
      .default('Scheduled'),
    saveAnyway: z.boolean().optional().default(false),
    recurrence: z
      .object({
        frequency: z.enum(['none', 'daily', 'weekly']).default('none'),
        until: z.string().nullable().optional(),
      })
      .optional(),
    tasks: z.array(z.string()).optional(),
  }).refine((data) => new Date(data.startTime) < new Date(data.endTime), {
    message: 'End time must be after start time',
    path: ['endTime'],
  }),
});

export const checkConflictsSchema = z.object({
  body: z.object({
    circleId: z.string().min(1, 'Circle ID is required'),
    caregiverId: z.string().optional(),
    startTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Valid start time is required',
    }),
    endTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Valid end time is required',
    }),
    excludeVisitId: z.string().optional().nullable(),
  }).refine((data) => new Date(data.startTime) < new Date(data.endTime), {
    message: 'End time must be after start time',
    path: ['endTime'],
  }),
});

export const taskSchema = z.object({
  body: z.object({
    description: z.string().min(2, 'Task description must be at least 2 characters'),
    notes: z.string().optional().default(''),
  }),
});
