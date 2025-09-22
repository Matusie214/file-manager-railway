# File Manager - Railway Deployment

A modern file management application built with Next.js, Prisma, and PostgreSQL, designed for easy deployment on Railway.

## Features

- 🔐 JWT Authentication (register/login)
- 📁 Folder management with hierarchy
- 📄 File upload/download with deduplication
- 🗃️ PostgreSQL database with Prisma ORM
- 🚀 Ready for Railway deployment

## Technology Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with httpOnly cookies
- **File Storage**: Local filesystem with SHA256 checksums
- **Deployment**: Railway

## Railway Deployment

### Prerequisites

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login to Railway:
```bash
railway login
```

### Deploy Steps

1. **Initialize Railway project:**
```bash
railway init
```

2. **Add PostgreSQL database:**
```bash
railway add postgresql
```

3. **Set environment variables:**
```bash
railway variables set JWT_SECRET=$(openssl rand -base64 32)
```

4. **Deploy the application:**
```bash
railway up
```

5. **Run database migration:**
```bash
railway run npx prisma migrate deploy
```

### Environment Variables

Railway will automatically set:
- `DATABASE_URL` (from PostgreSQL service)
- `PORT` (Railway default)

You need to set:
- `JWT_SECRET` (generate with `openssl rand -base64 32`)

### Local Development

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment:**
```bash
cp .env.example .env
# Edit .env with your local PostgreSQL URL and JWT secret
```

3. **Generate Prisma client:**
```bash
npx prisma generate
```

4. **Run migrations:**
```bash
npx prisma migrate dev
```

5. **Start development server:**
```bash
npm run dev
```

## Project Structure

```
file-manager-railway/
├── app/
│   ├── api/
│   │   ├── auth/          # Authentication endpoints
│   │   ├── files/         # File management
│   │   └── folders/       # Folder management
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main application
├── components/ui/         # Reusable UI components
├── lib/
│   ├── auth.ts            # Authentication utilities
│   └── utils.ts           # General utilities
├── prisma/
│   └── schema.prisma      # Database schema
├── package.json
├── next.config.js
└── README.md
```

## Database Schema

### User
- `id`: Unique identifier
- `email`: User email (unique)
- `password`: Hashed password
- `name`: Optional display name

### Folder
- `id`: Unique identifier
- `name`: Folder name
- `path`: Materialized path for hierarchy
- `parentId`: Parent folder reference
- `userId`: Owner reference

### File
- `id`: Unique identifier
- `name`: Sanitized filename
- `originalName`: Original upload name
- `size`: File size in bytes
- `mimeType`: File MIME type
- `checksum`: SHA256 hash for deduplication
- `storagePath`: Local storage path
- `folderId`: Parent folder reference
- `userId`: Owner reference

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Files
- `GET /api/files?folderId=<id>` - List files
- `POST /api/files/upload` - Upload file
- `GET /api/files/[id]` - Download file
- `DELETE /api/files/[id]` - Delete file

### Folders
- `GET /api/folders?parentId=<id>` - List folders
- `POST /api/folders` - Create folder
- `DELETE /api/folders/[id]` - Delete folder

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma generate` - Generate Prisma client
- `npx prisma migrate dev` - Run migrations (development)
- `npx prisma migrate deploy` - Deploy migrations (production)
- `npx prisma studio` - Open Prisma Studio

## Railway Features Used

- **PostgreSQL**: Managed database service
- **Environment Variables**: Automatic DATABASE_URL injection
- **Build Process**: Automatic Prisma generation
- **Zero-config Deployment**: Dockerfile not needed
- **Custom Domain**: Available on paid plans
- **Automatic HTTPS**: SSL termination included