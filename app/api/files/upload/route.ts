import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { PrismaClient } from '@prisma/client'
import { verifyAuth, unauthorizedResponse } from '@/lib/auth'
import { calculateChecksum, sanitizeFileName } from '@/lib/utils'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) {
    return unauthorizedResponse()
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folderId = formData.get('folderId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (folderId) {
      const folder = await prisma.folder.findFirst({
        where: { id: folderId, userId: auth.userId }
      })
      if (!folder) {
        return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
      }
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const checksum = calculateChecksum(buffer)

    const existingFile = await prisma.file.findUnique({
      where: { userId_checksum: { userId: auth.userId, checksum } }
    })

    if (existingFile) {
      return NextResponse.json({ error: 'File already exists' }, { status: 409 })
    }

    const uploadsDir = join(process.cwd(), 'uploads', auth.userId)
    await mkdir(uploadsDir, { recursive: true })

    const fileExtension = file.name.split('.').pop() || ''
    const sanitizedName = sanitizeFileName(file.name)
    const uniqueFileName = `${uuidv4()}.${fileExtension}`
    const filePath = join(uploadsDir, uniqueFileName)

    await writeFile(filePath, buffer)

    const savedFile = await prisma.file.create({
      data: {
        name: sanitizedName,
        originalName: file.name,
        size: BigInt(buffer.length),
        mimeType: file.type || 'application/octet-stream',
        checksum,
        storagePath: filePath,
        userId: auth.userId,
        folderId: folderId || null
      }
    })

    return NextResponse.json({
      id: savedFile.id,
      name: savedFile.name,
      originalName: savedFile.originalName,
      size: savedFile.size.toString(),
      mimeType: savedFile.mimeType,
      createdAt: savedFile.createdAt
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}