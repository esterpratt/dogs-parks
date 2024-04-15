import { Outlet, RouterProvider, createBrowserRouter } from 'react-router-dom';
import './App.scss';
import { Home } from './pages/Home';
import { Park } from './pages/Park';
import { parkLoader } from './loaders/parkLoader';

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      // TODO: replace
      <div>
        <Outlet />
      </div>
    ),
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
    ],
  },
]);

const App = () => {
  return <RouterProvider router={router} />;
};

export default App;
