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

import { userLoader } from './loaders/userLoader';
import { usersLoader } from './loaders/usersLoader';

import { UserContextProvider } from './context/UserContext';
import { ThankYouModalContextProvider } from './context/ThankYouModalContext';
import { DeletionConfirmation } from './pages/DeletionConfirmation';
import { PrivateRoute } from './pages/PrivateRoute';

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
              path: 'dogs/:dogId',
              element: <UserDog />,
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
          path: '/users',
          element: <Users />,
          loader: usersLoader,
        },
      ],
    },
  ]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThankYouModalContextProvider>
        <UserContextProvider>
          <RouterProvider router={router} />
        </UserContextProvider>
      </ThankYouModalContextProvider>
    </QueryClientProvider>
  );
};

export default App;
