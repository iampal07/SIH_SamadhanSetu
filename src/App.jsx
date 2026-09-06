import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { usePlatform } from './context/PlatformContext';
import { Toasts } from './components/shared/ui';
import PublicLayout from './pages/Home/PublicLayout';
import Home from './pages/Home/Home';
import HowItWorks from './pages/Home/HowItWorks';
import About from './pages/Home/About';
import Simulation from './pages/Simulation/Simulation';
import CitizenDashboard from './pages/Citizen/CitizenDashboard';
import UniversityDashboard from './pages/University/UniversityDashboard';
import IndustryDashboard from './pages/Industry/IndustryDashboard';
import GovernmentDashboard from './pages/Government/GovernmentDashboard';
import Login from './pages/Auth/Login';
import AuthCallback from './pages/Auth/AuthCallback';
import Onboarding from './pages/Auth/Onboarding';
import ProtectedRoute from './components/auth/ProtectedRoute';
import NotFound from './pages/Home/NotFound';

export default function App() {
  const { toast, dispatch } = usePlatform();
  const loc = useLocation();

  return (
    <>
      <AnimatePresence mode="wait">
        <Routes location={loc} key={loc.pathname.split('/')[1] || 'root'}>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/about" element={<About />} />
          </Route>
          
          {/* Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/onboarding" element={<Onboarding />} />

          {/* Interactive Simulation / Presentation Flow */}
          <Route path="/simulation" element={<Simulation />} />

          {/* 4 Dedicated Stakeholder Portals (Role Protected) */}
          <Route
            path="/citizen/*"
            element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <CitizenDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/university/*"
            element={
              <ProtectedRoute allowedRoles={['varsity']}>
                <UniversityDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/industry/*"
            element={
              <ProtectedRoute allowedRoles={['industry']}>
                <IndustryDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/government/*"
            element={
              <ProtectedRoute allowedRoles={['govt']}>
                <GovernmentDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="/dashboards" element={<Navigate to="/citizen" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
      <Toasts toast={toast} onDone={() => dispatch({ type: 'CLEAR_TOAST' })} />
    </>
  );
}
