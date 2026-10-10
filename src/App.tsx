import { lazy } from 'react';
import {
  Navigate,
  createBrowserRouter,
  RouterProvider,
} from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import './App.scss';
import { NotificationProvider } from './context/NotificationContext';
import { UserContextProvider } from './context/UserContext';
import { UserLocationProvider } from './context/LocationContext';
import { OrientationProvider } from './context/OrientationContext';
import { ModeProvider } from './context/ModeContext';
import { ConfirmModalProvider } from './context/ConfirmModalContext';
import { Home } from './pages/Home';
import { RootLayout } from './RootLayout';
import { ErrorPage } from './pages/Error';
import { AuthCallback } from './pages/AuthCallback';
import { EmailCallback } from './pages/EmailCallback';
import { queryClient } from './services/react-query';
import { PrivateRoute } from './pages/PrivateRoute';
import { userLoader } from './loaders/userLoader';
import { parkLoader } from './loaders/parkLoader';
import { ShareRedirect } from './pages/ShareRedirect';

const UserDog = lazy(() => import('./pages/UserDog'));
const UserReviews = lazy(() => import('./pages/UserReviews'));
const UserFriends = lazy(() => import('./pages/UserFriends'));
const UserFavorites = lazy(() => import('./pages/UserFavorites'));
const Settings = lazy(() => import('./pages/Settings'));
const UserEvents = lazy(() => import('./pages/UserEvents'));
const ParkReviews = lazy(() => import('./pages/ParkReviews'));
const ParkVisitors = lazy(() => import('./pages/ParkVisitors'));
const Profile = lazy(() => import('./pages/Profile'));
const Parks = lazy(() => import('./pages/Parks'));
const Users = lazy(() => import('./pages/Users'));
const UserDogs = lazy(() => import('./pages/UserDogs'));
const Park = lazy(() => import('./pages/Park'));
const ParkDetails = lazy(() => import('./pages/ParkDetails'));
const NewPark = lazy(() => import('./pages/NewPark'));
const UpdatePassowrd = lazy(() => import('./pages/UpdatePassword'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const DeleteAcount = lazy(() => import('./pages/DeleteAcount'));
const DeletionConfirmation = lazy(() => import('./pages/DeletionConfirmation'));
const About = lazy(() => import('./pages/About'));
const Login = lazy(() => import('./pages/Login'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Event = lazy(() => import('./pages/Event'));
const DogOwnership = lazy(() => import('./pages/DogOwnership'));
const DogOwnershipRequest = lazy(() => import('./pages/DogOwnershipRequest'));
const OwnershipAction = lazy(() => import('./pages/OwnershipAction'));
const OwnershipActionRedirect = lazy(
  () => import('./pages/OwnershipActionRedirect'),
);
const DogOwnershipLeave = lazy(() => import('./pages/DogOwnershipLeave'));
const DogOwnershipDeletion = lazy(() => import('./pages/DogOwnershipDeletion'));
const AccountDeletionReview = lazy(
  () => import('./pages/AccountDeletionReview'),
);

const App = () => {
  const router = createBrowserRouter([
    {
      path: '/',
      element: <RootLayout />,
      errorElement: <ErrorPage />,
      children: [
        {
          index: true,
          element: <Home />,
        },
        {
          path: '/auth-callback',
          element: <AuthCallback />,
        },
        {
          path: '/email-callback',
          element: <EmailCallback />,
        },
        {
          path: '/share/parks/:parkId',
          element: <ShareRedirect />,
        },
        {
          path: '/about',
          element: <About />,
        },
        {
          path: '/update-password',
          element: <UpdatePassowrd />,
        },
        {
          path: '/parks',
          element: <Parks />,
        },
        {
          path: '/parks/new',
          element: <NewPark />,
        },
        {
          path: '/parks/:id/',
          element: <Park />,
          loader: parkLoader,
          children: [
            {
              index: true,
              element: <ParkDetails />,
            },
            {
              path: 'reviews',
              element: <ParkReviews />,
            },
            {
              path: 'visitors',
              element: <ParkVisitors />,
            },
          ],
        },
        {
          path: '/login',
          element: <Login />,
        },
        {
          path: '/user-deleted',
          element: <DeletionConfirmation />,
        },
        {
          path: '/delete-account',
          element: <DeleteAcount />,
        },
        {
          path: '/privacy-policy',
          element: <PrivacyPolicy />,
        },
        {
          path: '/profile/:id',
          element: (
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          ),
          loader: userLoader,
          children: [
            {
              index: true,
              element: <Navigate to="dogs" replace />,
            },
            {
              path: 'dogs',
              element: <UserDogs />,
            },
            {
              path: 'reviews',
              element: <UserReviews />,
            },
            {
              path: 'friends',
              element: <UserFriends />,
            },
            {
              path: 'favorites',
              element: <UserFavorites />,
            },
            {
              path: 'events',
              element: <UserEvents />,
            },
          ],
        },
        {
          path: '/profile/:id/settings',
          element: (
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          ),
        },
        {
          path: '/profile/:id/settings/delete-account',
          element: (
            <PrivateRoute>
              <AccountDeletionReview />
            </PrivateRoute>
          ),
        },
        // Keep the dog header mounted while ownership tabs and short modal
        // routes change, including when opened directly from a saved URL.
        {
          path: 'dogs/:dogId',
          element: (
            <PrivateRoute>
              <UserDog />
            </PrivateRoute>
          ),
          children: [
            {
              path: 'ownership/request',
              element: <DogOwnershipRequest />,
            },
            {
              path: 'ownership',
              element: <DogOwnership />,
              children: [
                { path: 'leave', element: <DogOwnershipLeave /> },
                {
                  path: 'actions/:actionType/:actionId',
                  element: <OwnershipAction />,
                },
              ],
            },
          ],
        },
        {
          path: 'dogs/:dogId/ownership/deletion/:proposalId',
          element: (
            <PrivateRoute>
              <DogOwnershipDeletion />
            </PrivateRoute>
          ),
        },
        {
          path: 'ownership-actions/deletion/:proposalId',
          element: (
            <PrivateRoute>
              <DogOwnershipDeletion />
            </PrivateRoute>
          ),
        },
        {
          path: 'ownership-actions/:actionType/:actionId',
          element: (
            <PrivateRoute>
              <OwnershipActionRedirect />
            </PrivateRoute>
          ),
        },
        {
          path: '/events/:eventId',
          element: (
            <PrivateRoute>
              <Event />
            </PrivateRoute>
          ),
        },
        {
          path: '/users',
          element: <Users />,
        },
        {
          path: '/notifications',
          element: (
            <PrivateRoute>
              <Notifications />
            </PrivateRoute>
          ),
        },
      ],
    },
  ]);

  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <ModeProvider>
          <ConfirmModalProvider>
            <UserLocationProvider>
              <OrientationProvider>
                <UserContextProvider>
                  <RouterProvider router={router} />
                </UserContextProvider>
              </OrientationProvider>
            </UserLocationProvider>
          </ConfirmModalProvider>
        </ModeProvider>
      </NotificationProvider>
    </QueryClientProvider>
  );
};

export default App;
