import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './components/Layout';
import { RequireAuth, RequireRoles } from './components/RouteGuards';
import Landing from './pages/Landing';
import Library from './pages/Library';
import ComicDetail from './pages/ComicDetail';
import ComicReader from './pages/ComicReader';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import Download from './pages/Download';
import CreatorStudio from './pages/CreatorStudio';
import CreatorEditor from './pages/CreatorEditor';
import AdminReviews from './pages/AdminReviews';
import AdminComments from './pages/AdminComments';
import AdminComics from './pages/AdminComics';
import AdminCreatorRequests from './pages/AdminCreatorRequests';
import AdminUsers from './pages/AdminUsers';
import CreatorPublicProfile from './pages/CreatorPublicProfile';
import Onboarding from './pages/Onboarding';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';

function App() {
  const { checkAuth } = useAuthStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Landing />} />
        <Route path="library" element={<Library />} />
        <Route path="comic/:id" element={<ComicDetail />} />
        <Route path="creator/:creatorNick" element={<CreatorPublicProfile />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="verify-email" element={<VerifyEmail />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="downloads" element={<Download />} />

        <Route element={<RequireAuth />}>
          <Route path="comic/:id/read" element={<ComicReader />} />
          <Route path="onboarding" element={<Onboarding />} />
          <Route path="profile" element={<Profile />} />

          <Route element={<RequireRoles roles={['creator', 'admin']} />}>
            <Route path="creator/studio" element={<CreatorStudio />} />
            <Route path="creator/editor/:comicId" element={<CreatorEditor />} />
          </Route>

          <Route element={<RequireRoles roles={['admin']} />}>
            <Route path="admin/reviews" element={<AdminReviews />} />
            <Route path="admin/comments" element={<AdminComments />} />
            <Route path="admin/comics" element={<AdminComics />} />
            <Route path="admin/creator-requests" element={<AdminCreatorRequests />} />
            <Route path="admin/users" element={<AdminUsers />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}

export default App;

