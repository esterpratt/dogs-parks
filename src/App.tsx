import { Outlet, RouterProvider, createBrowserRouter } from 'react-router-dom';
import './App.scss';
import { Home } from './pages/Home';
import { Park } from './pages/Park';
import { parkLoader } from './loaders/parkLoader';
import { ErrorPage } from './pages/Error';
import { Signin } from './pages/Signin';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { UserContextProvider } from './context/UserContext';
import { Profile } from './pages/Profile';
import { userLoader } from './loaders/userLoader';

const App = () => {
  const router = createBrowserRouter([
    {
      path: '/',
      element: (
        // TODO: replace
        <div>
          <Navbar />
          <Outlet />
        </div>
      ),
      errorElement: <ErrorPage />,
      children: [
        {
          index: true,
          element: <Home />,
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
