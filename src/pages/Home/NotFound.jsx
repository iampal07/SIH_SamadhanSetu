import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center mesh px-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="w-16 h-16 rounded-2xl grid place-items-center text-white mx-auto mb-4"
          style={{ background: 'linear-gradient(135deg,#4f46e5,#06b6d4)' }}><Compass size={28} /></div>
        <p className="font-display text-4xl font-extrabold text-slate-900">Page not found</p>
        <p className="text-slate-500 mt-2">That route does not exist in this prototype.</p>
        <Link to="/" className="btn btn-primary mt-5"><ArrowLeft size={15} />Back to homepage</Link>
      </motion.div>
    </div>
  );
}
