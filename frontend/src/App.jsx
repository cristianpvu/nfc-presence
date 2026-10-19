import { Navigate, Route, Routes } from 'react-router-dom';
import { getSession, isAdmin } from './session';
import Scan from './pages/Scan';
import TestDevice from './pages/TestDevice';
import Login from './pages/Login';
import Courses from './pages/Courses';
import CourseView from './pages/CourseView';
import AdminCourses from './pages/admin/AdminCourses';
import AdminRooms from './pages/admin/AdminRooms';
import AdminRoomDesks from './pages/admin/AdminRoomDesks';
import AdminUsers from './pages/admin/AdminUsers';

function RequireAuth({ children }) {
  return getSession() ? children : <Navigate to="/login" replace />;
}

function Home() {
  return isAdmin() ? <Navigate to="/admin/courses" replace /> : <Courses />;
}

function RequireAdmin({ children }) {
  if (!getSession()) return <Navigate to="/login" replace />;
  return isAdmin() ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/scan" element={<Scan />} />
      <Route path="/test-device" element={<TestDevice />} />
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
      <Route path="/courses/:id" element={<RequireAuth><CourseView /></RequireAuth>} />
      <Route path="/admin/courses" element={<RequireAdmin><AdminCourses /></RequireAdmin>} />
      <Route path="/admin/rooms" element={<RequireAdmin><AdminRooms /></RequireAdmin>} />
      <Route path="/admin/rooms/:id" element={<RequireAdmin><AdminRoomDesks /></RequireAdmin>} />
      <Route path="/admin/users" element={<RequireAdmin><AdminUsers /></RequireAdmin>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
