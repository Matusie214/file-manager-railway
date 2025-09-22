import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyAuth, unauthorizedResponse } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) {
    return unauthorizedResponse()
  }

  try {
    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get('folderId')

    const files = await prisma.file.findMany({
      where: {
        userId: auth.userId,
        folderId: folderId || null
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        originalName: true,
        size: true,
        mimeType: true,
        createdAt: true,
        updatedAt: true
      }
    })

    const formattedFiles = files.map(file => ({
      ...file,
      size: file.size.toString()
    }))

    return NextResponse.json(formattedFiles)
  } catch (error) {
    console.error('List files error:', error)
    return NextResponse.json({ error: 'Failed to list files' }, { status: 500 })
  }
}