# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a TOTP (Time-based One-Time Password) demo application using Twilio Verify API. The application allows users to create TOTP factors, display QR codes for authenticator apps, and verify/challenge TOTP codes.

## Architecture

The project uses a **client-server architecture** with two concurrent processes:

### Backend (Express Server)
- **Location**: `src/server.ts`
- **Port**: 4000 (configurable via `PORT` env var)
- **Purpose**: Handles Twilio Verify API integration
- **Key endpoints**:
  - `POST /api/create-factor`: Creates a TOTP factor for a user identity, returns QR code URI and secret
  - `POST /api/verify-factor`: Verifies TOTP factor activation with user-provided code
  - `POST /api/challenge`: Authenticates a user by validating their TOTP code

### Frontend (React + Vite)
- **Location**: `src/App.tsx`, `src/main.tsx`
- **Port**: 3000
- **Purpose**: UI for TOTP factor creation, QR code display, and code verification
- **Key features**:
  - Identity and friendly name input
  - QR code generation using `qrcode.react`
  - Factor verification and challenge testing

### Configuration
- **Vite proxy**: Configured to proxy `/api` requests to the backend server (localhost:4000)
- **Environment variables**: Required Twilio credentials stored in `.env` (see below)

## Development Commands

### Start Development Environment
```bash
npm run dev
```
Runs both client and server concurrently. Client available at http://localhost:3000, server at http://localhost:4000.

### Run Client Only
```bash
npm run dev:client
```
Starts Vite dev server with HMR on port 3000.

### Run Server Only
```bash
npm run dev:server
```
Starts Express server with `tsx watch` (auto-restart on changes) on port 4000.

### Build Production
```bash
npm run build
```
Compiles TypeScript and builds Vite production bundle to `dist/`.

### Lint Code
```bash
npm run lint
```
Runs ESLint on all TypeScript files.

### Preview Production Build
```bash
npm run preview
```
Serves the production build locally for testing.

## Environment Setup

**Required**: Create a `.env` file in the project root with the following variables:
```
TWILIO_ACCOUNT_SID=<your_account_sid>
TWILIO_AUTH_TOKEN=<your_auth_token>
TWILIO_VERIFY_SERVICE_SID=<your_verify_service_sid>
PORT=4000
```

The server will exit on startup if these credentials are missing.

## Key Technical Details

### TypeScript Configuration
- **Project references**: Uses TypeScript project references with separate configs for app (`tsconfig.app.json`) and Node/Vite tooling (`tsconfig.node.json`)
- Root `tsconfig.json` orchestrates both configs

### Twilio Verify Flow
1. **Create Factor**: Backend calls Twilio to generate TOTP seed and URI
2. **Display QR Code**: Frontend renders QR code and shows secret for manual entry
3. **Verify Factor**: User scans QR code in authenticator app, enters code to activate factor
4. **Challenge**: Once verified, subsequent authentications use challenge endpoint

### State Management
The React frontend uses local state (`useState`) to manage:
- User identity and factor details
- Generated factor data (includes `factorSid`, `identity`, `binding.uri`, `binding.secret`)
- Verification and challenge results

The backend is **stateless** and relies entirely on Twilio's API for factor storage.

## Code Patterns

- **Error handling**: Backend catches errors and returns 500 responses with error details
- **Type safety**: TypeScript with strict mode, though some `any` types used in frontend for API responses
- **Environment validation**: Server validates required env vars on startup
- **Concurrency**: Uses `concurrently` to run client and server in parallel during development
