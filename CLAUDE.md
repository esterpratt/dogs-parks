# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands

- `npm run dev` - Start development server with Vite
- `npm run build` - Build for production (runs TypeScript compilation then Vite build)
- `npm run lint` - Run ESLint with TypeScript support
- `npm run format` - Format code with Prettier
- `npm run test` - Run tests with Vitest
- `npm run preview` - Preview production build locally

### Mobile Development

- `npx cap sync` - Sync web assets to native platforms
- `npx cap sync android && npx cap open android` - Open Android project in Android Studio
- `npx cap run android` - Run on Android device/emulator
- `npx cap run ios` - Run on iOS device/simulator
- `npx cap open ios` - Open iOS project in Xcode
- `npx cap build android` - Build Android app
- `npx cap build ios` - Build iOS app
- `./.claude/commands/ios-dev-setup.sh` - iOS development setup script

## Architecture Overview

### Technology Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: SCSS with CSS Modules (camelCase convention for tsx files, kebab-case convention for scss files. classnames for className combinations)
- **Mobile**: Capacitor for cross-platform mobile deployment
- **Backend**: Supabase (PostgreSQL database with real-time features)
- **State Management**: Zustand for client state, React Query for server state
- **Routing**: React Router v7
- **Maps**: Leaflet with react-leaflet
- **Testing**: Vitest with jsdom environment

### Project Structure

- `src/pages/` - Route components with lazy loading
- `src/components/` - Reusable UI components organized by domain
- `src/services/` - API calls and business logic
- `src/context/` - React context providers for global state
- `src/hooks/` - Custom React hooks including API hooks
- `src/types/` - TypeScript type definitions
- `src/utils/` - Utility functions and helpers

### Key Architecture Patterns

#### Mobile-First Design

- Built primarily for mobile with Capacitor integration
- Uses safe area handling for iOS/Android
- Implements platform-specific keyboard and orientation handling
- Bottom navigation pattern for mobile UX

#### State Management Strategy

- **Server State**: React Query for caching, synchronization, and background updates
- **Global Client State**: React Context for user authentication, location, notifications
- **Local Component State**: useState/useReducer for component-specific state
- **URL State**: React Router for navigation and shareable state

#### Authentication & User Management

- Supabase Auth with Google and Apple sign-in
- User context provides authentication state across the app
- Private routes protection with PrivateRoute component
- Real-time user session management

#### Data Layer

- Supabase client for database operations
- Services layer abstracts API calls from components
- API calls are using react-query
- Type-safe database schema with TypeScript
- Real-time subscriptions for live data updates

### Component Organization

- **Modular Components**: Each component has its own .module.scss file
- **Domain-Driven Structure**: Components grouped by feature (park/, dog/, user/, etc.)
- **Shared Components**: Common UI elements in components/ root
- **Lazy Loading**: Route-level code splitting for better performance

### Development Patterns

- CSS Modules with SCSS for styling
- Custom hooks for reusable logic
- Error boundaries and proper error handling
- TypeScript strict mode enabled
- ESLint with React and TypeScript rules

### Mobile Platform Integration

- Capacitor plugins for native device features (camera, geolocation, etc.)
- Platform detection utilities in utils/platform.ts
- iOS and Android specific configurations
- Web fallbacks for development

### Key Services

- `supabase-client.ts` - Database connection and configuration
- `authentication.ts` - Login, logout, and user management
- `parks.ts` - Dog park data operations
- `dogs.ts` - Pet management functionality
- `map.ts` - Location and mapping services
- `image.ts` - Image upload and processing

### Code Conventions

- Use clear variables names, also inside array functions
- Extract props inside a function
- Export in the end of a file (never export individual functions inline)
- Don't use single line if statements - always use curly braces {}
- Use interface for functions/components props type
- Types that are used in more than one file should be set in the 'types' folder. Types that are used only in one file should be set on the file

**For folder-specific conventions, see:** `.claude/folder-conventions.md`

### SCSS Conventions

- Use pixels and not rems
- Do not use font weight
