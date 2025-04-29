import { lazy } from 'react';
import { Navigate, createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { QueryClientProvider } from '@tanstack/react-query';
import './App.scss';
import { Home } from './pages/Home';
import { RootLayout } from './RootLayout';
import { ErrorPage } from './pages/Error';
import { Signin } from './pages/Signin';
import { Login } from './pages/Login';
import { Profile } from './pages/Profile';
import { Parks } from './pages/Parks';
import { Users } from './pages/Users';
import { UserDogs } from './pages/UserDogs';
import { Park } from './pages/Park';
import { ParkDetails } from './pages/ParkDetails';
import { NewPark } from './pages/NewPark';

import { queryClient } from './services/react-query';

import { UserContextProvider } from './context/UserContext';
import { DeletionConfirmation } from './pages/DeletionConfirmation';
import { PrivateRoute } from './pages/PrivateRoute';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { ThankYouModalProvider } from './context/ThankYouModalContext';
import { OrientationProvider } from './context/OrientationContext';
import { AuthCallback } from './pages/AuthCallback';
import { userLoader } from './loaders/userLoader';
import { UpdatePassowrd } from './pages/UpdatePassword';
import { About } from './pages/About';
import { UserLocationProvider } from './context/LocationContext';

const UserDog = lazy(() => import('./pages/UserDog'));
const UserReviews = lazy(() => import('./pages/UserReviews'));
const UserFriends = lazy(() => import('./pages/UserFriends'));
const UserFavorites = lazy(() => import('./pages/UserFavorites'));
const UserInfo = lazy(() => import('./pages/UserInfo'));
const ParkReviews = lazy(() => import('./pages/ParkReviews'));
const ParkVisitors = lazy(() => import('./pages/ParkVisitors'));

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
          path: '/signin',
          element: <Signin />,
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
      ],
    },
  ]);

  return (
    <UserLocationProvider>
      <OrientationProvider>
        <ThankYouModalProvider>
          <QueryClientProvider client={queryClient}>
            <UserContextProvider>
              <RouterProvider router={router} />
            </UserContextProvider>
          </QueryClientProvider>
        </ThankYouModalProvider>
      </OrientationProvider>
    </UserLocationProvider>
  );
};

export default App;
