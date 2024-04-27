import { RouterProvider, createBrowserRouter } from 'react-router-dom';
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
          path: '/parks/:id',
          element: <Park />,
          loader: parkLoader,
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
        },
      ],
    },
  ]);

  return (
    <UserContextProvider>
      <RouterProvider router={router} />
    </UserContextProvider>
  );
};

export default App;
