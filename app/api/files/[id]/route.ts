import { NextRequest, NextResponse } from 'next/server'
import { readFile, unlink } from 'fs/promises'
import { PrismaClient } from '@prisma/client'
import { verifyAuth, unauthorizedResponse } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAuth(request)
  if (!auth) {
    return unauthorizedResponse()
  }

  try {
    const { id } = await params
    const file = await prisma.file.findFirst({
      where: { id, userId: auth.userId }
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const fileBuffer = await readFile(file.storagePath)

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': file.mimeType,
        'Content-Disposition': `attachment; filename="${file.originalName}"`,
        'Content-Length': file.size.toString()
      }
    })
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json({ error: 'Download failed' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAuth(request)
  if (!auth) {
    return unauthorizedResponse()
  }

  try {
    const { id } = await params
    const file = await prisma.file.findFirst({
      where: { id, userId: auth.userId }
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    try {
      await unlink(file.storagePath)
    } catch (fsError) {
      console.warn('Failed to delete file from storage:', fsError)
    }

    await prisma.file.delete({
      where: { id: file.id }
    })

    return NextResponse.json({ message: 'File deleted successfully' })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}