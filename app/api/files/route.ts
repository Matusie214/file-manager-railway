import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth, unauthorizedResponse } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) {
    return unauthorizedResponse()
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 })
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