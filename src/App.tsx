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
import { ModeProvider } from './context/ModeContext';

const UserDog = lazy(() => import('./pages/UserDog'));
const UserReviews = lazy(() => import('./pages/UserReviews'));
const UserFriends = lazy(() => import('./pages/UserFriends'));
const UserFavorites = lazy(() => import('./pages/UserFavorites'));
const UserInfo = lazy(() => import('./pages/UserInfo'));
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
              path: 'info',
              element: <UserInfo />,
            },
          ],
        },
        {
          path: 'dogs/:dogId',
          element: (
            <PrivateRoute>
              <UserDog />
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
          <UserLocationProvider>
            <OrientationProvider>
              <UserContextProvider>
                <RouterProvider router={router} />
              </UserContextProvider>
            </OrientationProvider>
          </UserLocationProvider>
        </ModeProvider>
      </NotificationProvider>
    </QueryClientProvider>
  );
};

export default App;
