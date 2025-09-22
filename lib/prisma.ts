import { PrismaClient } from '@prisma/client'

let prisma: PrismaClient | null = null

try {
  if (process.env.DATABASE_URL) {
    prisma = new PrismaClient()
  } else {
    console.warn('DATABASE_URL not set - database operations will fail')
  }
} catch (error) {
  console.error('Failed to initialize Prisma client:', error)
}

export { prisma }