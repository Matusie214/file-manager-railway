import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyAuth, unauthorizedResponse } from '@/lib/auth'

const prisma = new PrismaClient()

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
    const folder = await prisma.folder.findFirst({
      where: { id, userId: auth.userId }
    })

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

    const hasChildren = await prisma.folder.findFirst({
      where: { parentId: folder.id }
    })

    if (hasChildren) {
      return NextResponse.json(
        { error: 'Cannot delete folder with subfolders' },
        { status: 400 }
      )
    }

    const hasFiles = await prisma.file.findFirst({
      where: { folderId: folder.id }
    })

    if (hasFiles) {
      return NextResponse.json(
        { error: 'Cannot delete folder with files' },
        { status: 400 }
      )
    }

    await prisma.folder.delete({
      where: { id: folder.id }
    })

    return NextResponse.json({ message: 'Folder deleted successfully' })
  } catch (error) {
    console.error('Delete folder error:', error)
    return NextResponse.json({ error: 'Failed to delete folder' }, { status: 500 })
  }
}