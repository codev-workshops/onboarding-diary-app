import { describe, it, expect } from 'vitest'
import { loginSchema, registerSchema } from '../../utils/validation'

describe('loginSchema', () => {
  it('passes with valid email and password', () => {
    const result = loginSchema.safeParse({ email: 'user@test.com', password: 'pass' })
    expect(result.success).toBe(true)
  })

  it('fails with empty email', () => {
    const result = loginSchema.safeParse({ email: '', password: 'pass' })
    expect(result.success).toBe(false)
  })

  it('fails with invalid email format', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'pass' })
    expect(result.success).toBe(false)
  })

  it('fails with empty password', () => {
    const result = loginSchema.safeParse({ email: 'user@test.com', password: '' })
    expect(result.success).toBe(false)
  })
})

describe('registerSchema', () => {
  const validData = {
    email: 'user@test.com',
    password: 'P@ssw0rd!',
    fullName: 'Test User',
  }

  it('passes with valid data', () => {
    const result = registerSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('fails with short password', () => {
    const result = registerSchema.safeParse({ ...validData, password: 'short' })
    expect(result.success).toBe(false)
  })

  it('fails with password missing uppercase', () => {
    const result = registerSchema.safeParse({ ...validData, password: 'p@ssw0rd!' })
    expect(result.success).toBe(false)
  })

  it('fails with password missing digit', () => {
    const result = registerSchema.safeParse({ ...validData, password: 'P@ssword!' })
    expect(result.success).toBe(false)
  })

  it('fails with password missing special char', () => {
    const result = registerSchema.safeParse({ ...validData, password: 'Passw0rdd' })
    expect(result.success).toBe(false)
  })

  it('fails with short name', () => {
    const result = registerSchema.safeParse({ ...validData, fullName: 'A' })
    expect(result.success).toBe(false)
  })
})
