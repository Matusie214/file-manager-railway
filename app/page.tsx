'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { FolderIcon, FileIcon, UploadIcon, Plus } from 'lucide-react'

interface File {
  id: string
  name: string
  originalName: string
  size: string
  mimeType: string
  createdAt: string
}

interface Folder {
  id: string
  name: string
  path: string
  parentId: string | null
  createdAt: string
}

export default function HomePage() {
  const [files, setFiles] = useState<File[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      loadFiles()
      loadFolders()
    }
  }, [isAuthenticated, currentFolderId])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        setIsAuthenticated(true)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      if (response.ok) {
        setIsAuthenticated(true)
        setEmail('')
        setPassword('')
      } else {
        const error = await response.json()
        alert(error.error || 'Authentication failed')
      }
    } catch (error) {
      alert('Authentication failed')
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setIsAuthenticated(false)
      setFiles([])
      setFolders([])
      setCurrentFolderId(null)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const loadFiles = async () => {
    try {
      const params = new URLSearchParams()
      if (currentFolderId) params.append('folderId', currentFolderId)
      
      const response = await fetch(`/api/files?${params}`)
      if (response.ok) {
        const data = await response.json()
        setFiles(data)
      }
    } catch (error) {
      console.error('Failed to load files:', error)
    }
  }

  const loadFolders = async () => {
    try {
      const params = new URLSearchParams()
      if (currentFolderId) params.append('parentId', currentFolderId)
      
      const response = await fetch(`/api/folders?${params}`)
      if (response.ok) {
        const data = await response.json()
        setFolders(data)
      }
    } catch (error) {
      console.error('Failed to load folders:', error)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    if (currentFolderId) formData.append('folderId', currentFolderId)

    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        loadFiles()
      } else {
        const error = await response.json()
        alert(error.error || 'Upload failed')
      }
    } catch (error) {
      alert('Upload failed')
    }
  }

  const createFolder = async () => {
    const name = prompt('Enter folder name:')
    if (!name) return

    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, parentId: currentFolderId })
      })

      if (response.ok) {
        loadFolders()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create folder')
      }
    } catch (error) {
      alert('Failed to create folder')
    }
  }

  const downloadFile = async (fileId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      alert('Download failed')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              {isLogin ? 'Sign in to your account' : 'Create new account'}
            </h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleAuth}>
            <div className="space-y-4">
              <input
                type="email"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="password"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <Button type="submit" className="w-full">
                {isLogin ? 'Sign in' : 'Sign up'}
              </Button>
            </div>
            <div className="text-center">
              <button
                type="button"
                className="text-blue-600 hover:text-blue-500"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">File Manager</h1>
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex gap-4 mb-6">
            <Button onClick={createFolder}>
              <Plus className="w-4 h-4 mr-2" />
              New Folder
            </Button>
            <label className="cursor-pointer">
              <Button asChild>
                <span>
                  <UploadIcon className="w-4 h-4 mr-2" />
                  Upload File
                </span>
              </Button>
              <input
                type="file"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
            {currentFolderId && (
              <Button 
                variant="outline" 
                onClick={() => setCurrentFolderId(null)}
              >
                Back to Root
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {folders.map((folder) => (
              <div
                key={folder.id}
                className="bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setCurrentFolderId(folder.id)}
              >
                <FolderIcon className="w-8 h-8 text-blue-500 mb-2" />
                <h3 className="font-medium text-gray-900 truncate">{folder.name}</h3>
                <p className="text-sm text-gray-500">{new Date(folder.createdAt).toLocaleDateString()}</p>
              </div>
            ))}

            {files.map((file) => (
              <div
                key={file.id}
                className="bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => downloadFile(file.id, file.originalName)}
              >
                <FileIcon className="w-8 h-8 text-gray-500 mb-2" />
                <h3 className="font-medium text-gray-900 truncate">{file.originalName}</h3>
                <p className="text-sm text-gray-500">
                  {Math.round(parseInt(file.size) / 1024)} KB • {new Date(file.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>

          {folders.length === 0 && files.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No files or folders found. Upload a file or create a folder to get started.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}