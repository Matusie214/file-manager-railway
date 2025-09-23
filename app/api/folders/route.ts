import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyAuth, unauthorizedResponse } from '@/lib/auth'
import { buildFolderPath } from '@/lib/utils'
import { prisma } from '@/lib/prisma'

const createFolderSchema = z.object({
  name: z.string().min(1).max(255),
  parentId: z.string().optional()
})

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) {
    return unauthorizedResponse()
  }

  try {
    const { searchParams } = new URL(request.url)
    const parentId = searchParams.get('parentId')

    const folders = await prisma.folder.findMany({
      where: {
        userId: auth.userId,
        parentId: parentId || null
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        path: true,
        parentId: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json(folders)
  } catch (error) {
    console.error('List folders error:', error)
    return NextResponse.json({ error: 'Failed to list folders' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) {
    return unauthorizedResponse()
  }

  try {
    console.log('Create folder endpoint called')
    console.log('Prisma client available:', !!prisma)
    
    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 })
    }

    const body = await request.json()
    console.log('Request body:', body)
    
    const validation = createFolderSchema.safeParse(body)
    if (!validation.success) {
      console.log('Validation errors:', validation.error.errors)
      return NextResponse.json({ error: 'Invalid input data', details: validation.error.errors }, { status: 400 })
    }
    
    const { name, parentId } = validation.data

    let parentFolder = null
    if (parentId) {
      parentFolder = await prisma.folder.findFirst({
        where: { id: parentId, userId: auth.userId }
      })
      if (!parentFolder) {
        return NextResponse.json({ error: 'Parent folder not found' }, { status: 404 })
      }
    }

    const existingFolder = await prisma.folder.findFirst({
      where: {
        userId: auth.userId,
        parentId: parentId || null,
        name
      }
    })

    if (existingFolder) {
      return NextResponse.json({ error: 'Folder already exists' }, { status: 409 })
    }

    const path = buildFolderPath(parentFolder?.path || null, name)

    const folder = await prisma.folder.create({
      data: {
        name,
        path,
        parentId: parentId || null,
        userId: auth.userId
      }
    })

    return NextResponse.json({
      id: folder.id,
      name: folder.name,
      path: folder.path,
      parentId: folder.parentId,
      createdAt: folder.createdAt
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 })
    }
    console.error('Create folder error:', error)
    return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 })
  }
}