# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Rules for you

1. First think through the problem, read the codebase for relevant files, and write a plan to `.claude/todos/[task-name].md` (create a descriptive filename for each task).
2. The plan should have a list of todo items that you can check off as you complete them
3. Before you begin working, check in with me and I will verify the plan.
4. Then, begin working on the todo items, marking them as complete as you go.
5. Please every step of the way just give me a high level explanation of what changes you made
6. Make every task and code change you do as simple as possible. We want to avoid making any massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity.
7. Finally, add a review section to the todo.md file with a summary of the changes you made and any other relevant information.
8. DO NOT BE LAZY. NEVER BE LAZY. IF THERE IS A BUG FIND THE ROOT CAUSE AND FIX IT. NO TEMPORARY FIXES. YOU ARE A SENIOR DEVELOPER. NEVER BE LAZY
9. MAKE ALL FIXES AND CODE CHANGES AS SIMPLE AS HUMANLY POSSIBLE. THEY SHOULD ONLY IMPACT NECESSARY CODE RELEVANT TO THE TASK AND NOTHING ELSE. IT SHOULD IMPACT AS LITTLE CODE AS POSSIBLE. YOUR GOAL IS TO NOT INTRODUCE ANY BUGS. IT'S ALL ABOUT SIMPLICITY

## Development Commands

### Essential Commands

- `npm run dev` - Start development server with Vite
- `npm run build` - Build for production (runs TypeScript compilation then Vite build)
- `npm run lint` - Run ESLint with TypeScript support
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

## Problem-Solving Philosophy

When you encounter a problem with your implementation, follow this approach to find the best solution:

### 1. Question the Architecture First
Before working around a problem, ask yourself: **"Is the fundamental design wrong?"**

Consider if there's a simpler approach that eliminates the problem entirely rather than managing it with workarounds.

**Example:** If refetches are causing bugs, instead of preventing refetches, ask: "Can I design this so refetches are harmless?"

### 2. Separation of Concerns
When state is causing issues, check if you're mixing responsibilities. Consider separating:
- **What determines behavior** (IDs, flags, membership)
- **What provides data** (query cache, API responses)
- **What drives UI** (derived state, computed values)

**Example:** Instead of storing full objects in local state and syncing them, store only IDs locally and always use fresh data from the query cache.

### 3. Think in Primitives
Prefer storing minimal data (IDs, booleans, enums) over rich objects in local state. Let the source of truth (query cache, database) provide the full objects.

**Why:**
- Less state to manage = fewer bugs
- Eliminates synchronization problems
- Makes refetches and updates safe

### 4. Root Cause Analysis
When a solution requires complex workarounds (intricate optimistic updates, careful invalidation logic, conditional refetches, etc.), pause and ask:
- **"Am I solving the right problem?"**
- **"Is there a design that makes this trivial?"**
- **"What would need to change to avoid this problem entirely?"**

If you find yourself writing lots of defensive code to prevent edge cases, it's often a sign the architecture needs rethinking.

### 5. Discuss Trade-offs
When proposing a solution, explicitly discuss:
- What problem does this solve?
- What's the simplest alternative?
- What would need to change to avoid this problem?
- Are there simpler architectural changes that eliminate the need for this complexity?

### Key Principle: "Make the Problem Impossible"

**Prefer:** Designs that make problems impossible
**Over:** Carefully avoiding problems with complex logic

**Example:**
- ❌ Bad: Complex optimistic updates to avoid refetches that break state logic
- ✅ Good: Store IDs only, making refetches harmless

**Remember:** The best code is the code you don't have to write. If a design requires extensive workarounds, consider a simpler architecture instead.
