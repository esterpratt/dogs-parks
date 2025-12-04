# KlavHub - Dog Parks App

This is a mobile-first web application for finding and reviewing dog parks.

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

### SCSS Conventions

- Use pixels and not rems
- Do not use font weight

## Specific folders patterns

## src/components/

### File Naming

- Use PascalCase for component files (e.g., `UserProfile.tsx`)

### Component Structure

- Extract component props inside the component function
- Use clear variable names in all functions, including array methods
- Always use curly braces for if statements (no single-line)

### Styling

- Each component should have its own .module.scss file
- Use camelCase for className combinations in TSX files
- Use kebab-case convention in SCSS files

## src/services/

### File Structure

- Export in the end of a file. Do not export individaully every function
- Create all interfaces in the top of the file

### File Naming

- Use kebab-case for service files (e.g., `user-service.ts`)
- Group related operations in the same service file

### Function Structure

- Use descriptive function names that indicate the operation
- Use 'const' instead of 'function' to declare functions
- Use try-catch for every function
- In the catch, think hard about wether to throw an error or return something. Ask me if you are not sure. If there is a need to throw an error, use throwError from 'error.ts'. (e.g, `throwError(error)`)
- When requesting supabase, accept back the 'error', and throw it to the catch if there is an error. See existing functions for examples.

## src/hooks/

### File Naming

- Start with "use" prefix (e.g., `useUserData.ts`)
- Use camelCase for the rest of the name

## src/pages/

### File Naming

- Use PascalCase for page component files (e.g., `UserProfile.tsx`)
- Match the route name when possible

### Page Structure

- Keep pages lightweight - delegate logic to hooks and services
- Use lazy loading for route components

## src/types/

### File Naming

- Use CamelCase for type definition files (e.g., `UserTypes.ts`)
- Group related types in the same file

### Type Structure

- Use descriptive interface names with clear prefixes/suffixes
- Export all types individually (no default exports)

## src/utils/

### File Naming

- Use camelCase for utility files (e.g., `dateHelpers.ts`)
- Group related utilities in the same file

### Function Structure

- Export individual utility functions
- Include JSDoc comments for complex utilities
- Use pure functions when possible

## Component example

```
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import {
  Eye,
  Footprints,
  Hourglass,
  Navigation,
  TreeDeciduous,
  X,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import classnames from 'classnames';
import { useQuery } from '@tanstack/react-query';
import { Location, ParkJSON as Park } from '../../types/park';
import { fetchParkPrimaryImage, fetchParksJSON } from '../../services/parks';
import { FavoriteRibbon } from '../FavoriteRibbon';
import { fetchFavoriteParks } from '../../services/favorites';
import { Button } from '../Button';
import { useOrientationContext } from '../../context/OrientationContext';
import { Image } from '../Image';
import { useGeoFormat } from '../../hooks/useGeoFormat';
import { useAppLocale } from '../../hooks/useAppLocale';
import { parksKey, parkKey } from '../../hooks/api/keys';
import { APP_LANGUAGES } from '../../utils/consts';
import { fetchParkWithTranslation } from '../../services/parks';
import { resolveTranslatedPark } from '../../utils/parkTranslations';
import styles from './ParkPopup.module.scss';

interface ParkPopupProps {
  activePark: Park | null;
  onGetDirections: (location: Location) => void;
  isLoadingDirections: boolean;
  directions?: {
    distanceKm?: number;
    durationSeconds?: number;
    error?: string;
  };
  onClose: () => void;
  canGetDirections: boolean;
}

const HOUR_IN_MS = 1000 * 60 * 60;

const ParkPopup: React.FC<ParkPopupProps> = ({
  activePark,
  onGetDirections,
  isLoadingDirections,
  directions,
  onClose,
  canGetDirections,
}) => {
  const { t } = useTranslation();
  const { formatDistanceKm, formatTravelDurationSeconds } = useGeoFormat();
  const navigate = useNavigate();
  const currentLanguage = useAppLocale();
  const [isClosing, setIsClosing] = useState(false);
  const orientation = useOrientationContext((state) => state.orientation);

  const { data: image } = useQuery({
    queryKey: ['parkImage', activePark?.id],
    queryFn: async () => fetchParkPrimaryImage(activePark!.id),
    enabled: !!activePark,
  });

  const { data: favoriteParkIds } = useQuery({
    queryKey: ['favoriteParks'],
    queryFn: fetchFavoriteParks,
    staleTime: HOUR_IN_MS,
    gcTime: HOUR_IN_MS,
  });

  const { data: parksCurrentLang } = useQuery({
    queryKey: parksKey(currentLanguage),
    queryFn: () => fetchParksJSON({ language: currentLanguage }),
    placeholderData: (previous) => previous,
    retry: 0,
  });

  // prepare EN dataset as a fallback if needed
  const { data: parksEnglish } = useQuery({
    queryKey: parksKey(APP_LANGUAGES.EN),
    queryFn: () => fetchParksJSON({ language: APP_LANGUAGES.EN }),
    enabled: currentLanguage !== APP_LANGUAGES.EN,
    placeholderData: (previous) => previous,
    retry: 0,
  });

  // prefetch park with translation for current language
  useQuery({
    queryKey: parkKey(activePark?.id || '', currentLanguage),
    queryFn: () =>
      fetchParkWithTranslation({
        parkId: activePark!.id,
        language: currentLanguage,
      }),
    enabled: !!activePark?.id,
  });

  const translatedFromCurrent = activePark
    ? parksCurrentLang?.find((p) => p.id === activePark.id)
    : null;
  const translatedFromEnglish = activePark
    ? parksEnglish?.find((p) => p.id === activePark.id)
    : null;

  const {
    name: displayName,
    city: displayCity,
    address: displayAddress,
  } = resolveTranslatedPark({
    activePark,
    preferred: translatedFromCurrent,
    fallback: translatedFromEnglish,
  });

  const isFavorite =
    activePark && favoriteParkIds && favoriteParkIds.includes(activePark?.id);

  const onClickGetDirections = () => {
    if (activePark) {
      onGetDirections(activePark!.location);
    }
  };

  const onClickViewPark = () => {
    navigate(`/parks/${activePark?.id}`);
  };

  const handleTransitionEnd = () => {
    if (isClosing) {
      setIsClosing(false);
      onClose();
    }
  };

  return (
    <div
      className={classnames(
        styles.parkModal,
        !!activePark && !isClosing && styles.open,
        { [styles.noImg]: !image }
      )}
      onTransitionEnd={handleTransitionEnd}
    >
      <Button
        variant="round"
        className={styles.close}
        onClick={() => setIsClosing(true)}
      >
        <X size={18} />
      </Button>
      <Link
        to={`/parks/${activePark?.id}`}
        className={classnames(styles.imgContainer, {
          [styles.hidden]: orientation === 'portrait' && (directions || !image),
        })}
      >
        {image && <Image src={image} className={styles.img} />}
        {!image && (
          <div className={styles.noImg}>
            <TreeDeciduous size={56} color={styles.green} strokeWidth={1} />
          </div>
        )}
        {isFavorite && <FavoriteRibbon className={styles.favorite} />}
      </Link>
      <div className={styles.detailsContainer}>
        <div className={styles.details}>
          <Link to={`/parks/${activePark?.id}`} className={styles.name}>
            <span>{displayName}</span>{' '}
          </Link>
          <div className={styles.addressContainer}>
            <span className={styles.address}>{displayAddress},</span>{' '}
            <span className={styles.city}>{displayCity}</span>
          </div>
        </div>
        <div>
          {canGetDirections && (
            <div className={styles.directionsContainer}>
              {isLoadingDirections && <div>{t('parks.popup.loading')}</div>}
              {!isLoadingDirections && directions && (
                <div className={styles.directions}>
                  {directions.error ? (
                    <div className={styles.error}>{directions.error}</div>
                  ) : (
                    <>
                      <div className={styles.distance}>
                        <Footprints
                          className={classnames(
                            styles.icon,
                            styles.directionsIcon
                          )}
                          color={styles.pink}
                          size={16}
                        />
                        <span>
                          {formatDistanceKm({
                            km: directions.distanceKm ?? 0,
                            maximumFractionDigits: 1,
                          })}
                        </span>
                      </div>
                      <div className={styles.duration}>
                        <Hourglass
                          className={classnames(
                            styles.icon,
                            styles.directionsIcon
                          )}
                          color={styles.pink}
                          size={16}
                        />
                        <span>
                          {formatTravelDurationSeconds({
                            seconds: directions.durationSeconds ?? 0,
                          })}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
          <div className={styles.buttons}>
            {canGetDirections && (
              <Button
                variant="secondary"
                className={styles.button}
                onClick={onClickGetDirections}
              >
                <Navigation size={12} className={styles.icon} />
                <span>{t('parks.popup.leadTheWay')}</span>
              </Button>
            )}
            <Button className={styles.button} onClick={onClickViewPark}>
              <Eye size={12} className={styles.icon} />
              <span>{t('parks.preview.view')}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export { ParkPopup };

```
