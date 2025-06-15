import React from 'react';
import { 
  createBrowserRouter, 
  RouterProvider,
  createRoutesFromElements,
  Route
} from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layout
import Layout from './components/Layout';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import MentorSearch from './pages/MentorSearch';
import MentorshipRequests from './pages/MentorshipRequests';
import MentorshipSessions from './pages/MentorshipSessions';

// Auth context
import PrivateRoute from './components/PrivateRoute';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />}>
      <Route index element={<Home />} />
      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />
      <Route
        path="profile"
        element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        }
      />
      <Route
        path="mentors"
        element={
          <PrivateRoute>
            <MentorSearch />
          </PrivateRoute>
        }
      />
      <Route
        path="requests"
        element={
          <PrivateRoute>
            <MentorshipRequests />
          </PrivateRoute>
        }
      />
      <Route
        path="sessions"
        element={
          <PrivateRoute>
            <MentorshipSessions />
          </PrivateRoute>
        }
      />
    </Route>
  )
);

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}

export default App; 