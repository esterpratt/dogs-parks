import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
} from 'react-router-dom';
import './App.scss';
import { Home } from './pages/Home';
import { Park } from './pages/Park';
import { parkLoader } from './loaders/parkLoader';
import { ErrorPage } from './pages/Error';
import { Signin } from './pages/Signin';
import { Login } from './pages/Login';
import { UserContextProvider } from './context/UserContext';
import { Profile } from './pages/Profile';
import { userLoader } from './loaders/userLoader';
import { RootLayout } from './RootLayout';
import { NewPark } from './pages/NewPark';
import { Reviews } from './pages/ParkReviews';
import { reviewsLoader } from './loaders/reviewsLoader';
import { ParkDetails } from './pages/ParkDetails';
import { ParkVisitors } from './pages/ParkVisitors';
import { Users } from './pages/Users';
import { UserReviews } from './pages/UserReviews';
import { UserFriends } from './pages/UserFriends';
import { UserDog } from './pages/UserDog';
import { UserDogs } from './pages/UserDogs';
import { UserFavorites } from './pages/UserFavorites';
import { UserInfo } from './pages/UserInfo';
import { UserFriendsContextProvider } from './context/UserFriendsContext';

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
              element: <Reviews />,
              loader: reviewsLoader,
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
              element: <UserDog />,
            },
            {
              path: 'reviews',
              element: <UserReviews />,
              loader: reviewsLoader,
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
        },
      ],
    },
  ]);

  return (
    <UserContextProvider>
      <UserFriendsContextProvider>
        <RouterProvider router={router} />
      </UserFriendsContextProvider>
    </UserContextProvider>
  );
};

export default App;
