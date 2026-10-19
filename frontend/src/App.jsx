import { Navigate, Route, Routes } from 'react-router-dom';
import { getSession } from './session';
import Scan from './pages/Scan';
import Login from './pages/Login';
import Courses from './pages/Courses';
import CourseView from './pages/CourseView';

function RequireAuth({ children }) {
  return getSession() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/scan" element={<Scan />} />
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<RequireAuth><Courses /></RequireAuth>} />
      <Route path="/courses/:id" element={<RequireAuth><CourseView /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
