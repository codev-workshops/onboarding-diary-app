import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[a-z]/, 'Must contain a lowercase letter')
    .regex(/[0-9]/, 'Must contain a digit')
    .regex(/[^a-zA-Z0-9]/, 'Must contain a special character'),
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(150),
  department: z.string().max(100).optional().or(z.literal('')),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
