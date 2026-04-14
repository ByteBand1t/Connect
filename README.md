# ConnectAsset - B2B SaaS for Asset & Supply-Chain Management

ConnectAsset is a comprehensive B2B SaaS platform designed for efficient Asset and Supply-Chain Management.

## Tech Stack
- **Framework**: Next.js 16 (App Router, TypeScript)
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Auth.js (NextAuth v5 beta) with Credentials provider (JWT session strategy)
- **Infrastructure**: Docker Compose

## Key Features
- Multi-tenant Organization management
- Role-based access control (Owner, Admin, Member)
- Asset tracking and supply chain visibility
- Secure authentication and session management

## Getting Started

### Prerequisites
- Node.js 18+
- Docker and Docker Compose
- PostgreSQL

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/ByteBand1t/Connect.git
   cd Connect
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in `.env`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/connectasset"
   AUTH_SECRET="your-auth-secret"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```
4. Run database migrations:
   ```bash
   npx prisma migrate dev --name init
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Docker

You can run the app and database with Docker Compose:

```bash
docker compose up --build
```
