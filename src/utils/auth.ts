// Authentication utilities for WightCars
import { sign, verify } from 'hono/jwt'
import type { JWTPayload, User } from '../types'

const JWT_SECRET = 'wightcars-super-secret-key-2024' // In production, use environment variable

export async function generateJWT(user: User): Promise<string> {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
  }
  
  return await sign(payload, JWT_SECRET)
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const payload = await verify(token, JWT_SECRET) as JWTPayload
    return payload
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}

export function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7) // Remove 'Bearer ' prefix
}

// Password hashing utilities (simplified for demo - in production use proper bcrypt)
export async function hashPassword(password: string): Promise<string> {
  // For demo purposes, we'll use a simple approach
  // In production, use proper bcrypt with salt rounds
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'wightcars-salt')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const hashedPassword = await hashPassword(password)
  return hashedPassword === hash
}