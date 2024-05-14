import { Suspense, lazy } from 'react';
import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
} from 'react-router-dom';
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
import { NewPark } from './pages/NewPark';

import { UserContextProvider } from './context/UserContext';
import { UserFriendsContextProvider } from './context/UserFriendsContext';
import { ParksContextProvider } from './context/ParksContext';

import { parkLoader } from './loaders/parkLoader';
import { userLoader } from './loaders/userLoader';
import { reviewsLoader } from './loaders/reviewsLoader';

const UserDog = lazy(() => import('./pages/UserDog'));
const UserReviews = lazy(() => import('./pages/UserReviews'));
const UserFriends = lazy(() => import('./pages/UserFriends'));
const UserFavorites = lazy(() => import('./pages/UserFavorites'));
const UserInfo = lazy(() => import('./pages/UserInfo'));
const ParkReviews = lazy(() => import('./pages/ParkReviews'));
const ParkDetails = lazy(() => import('./pages/ParkDetails'));
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
          loader: parkLoader,
          children: [
            {
              index: true,
              element: (
                <Suspense fallback={<div>Loading...</div>}>
                  <ParkDetails />
                </Suspense>
              ),
            },
            {
              path: 'reviews',
              element: (
                <Suspense fallback={<div>Loading...</div>}>
                  <ParkReviews />
                </Suspense>
              ),
              loader: reviewsLoader,
            },
            {
              path: 'visitors',
              element: (
                <Suspense fallback={<div>Loading...</div>}>
                  <ParkVisitors />
                </Suspense>
              ),
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
          path: '/profile/:id',
          element: <Profile />,
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
              element: (
                <Suspense fallback={<div>Loading...</div>}>
                  <UserDog />
                </Suspense>
              ),
            },
            {
              path: 'reviews',
              element: (
                <Suspense fallback={<div>Loading...</div>}>
                  <UserReviews />
                </Suspense>
              ),
              loader: reviewsLoader,
            },
            {
              path: 'friends',
              element: (
                <Suspense fallback={<div>Loading...</div>}>
                  <UserFriends />
                </Suspense>
              ),
            },
            {
              path: 'favorites',
              element: (
                <Suspense fallback={<div>Loading...</div>}>
                  <UserFavorites />
                </Suspense>
              ),
            },
            {
              path: 'info',
              element: (
                <Suspense fallback={<div>Loading...</div>}>
                  <UserInfo />
                </Suspense>
              ),
            },
          ],
        },
        {
          path: '/users',
          element: <Users />,
        },
      ],
    },
  ]);

  return (
    <UserContextProvider>
      <UserFriendsContextProvider>
        <ParksContextProvider>
          <RouterProvider router={router} />
        </ParksContextProvider>
      </UserFriendsContextProvider>
    </UserContextProvider>
  );
};

export default App;
