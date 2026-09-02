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
          <Route path="/simulation" element={<Simulation />} />
          <Route path="/citizen/*" element={<CitizenDashboard />} />
          <Route path="/university/*" element={<UniversityDashboard />} />
          <Route path="/industry/*" element={<IndustryDashboard />} />
          <Route path="/government/*" element={<GovernmentDashboard />} />
          <Route path="/dashboards" element={<Navigate to="/citizen" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
      <Toasts toast={toast} onDone={() => dispatch({ type: 'CLEAR_TOAST' })} />
    </>
  );
}
