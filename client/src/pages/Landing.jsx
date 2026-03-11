// client/src/pages/Landing.jsx
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Navigate } from 'react-router-dom';

export default function Landing() {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto w-full">
        <span className="text-xl font-bold">🚗 SLIET RideShare</span>
        <div className="flex gap-3">
          <Link to="/login" className="px-4 py-2 rounded-lg border border-white/40 hover:bg-white/10 transition text-sm font-medium">Sign in</Link>
          <Link to="/register" className="px-4 py-2 rounded-lg bg-white text-blue-700 hover:bg-blue-50 transition text-sm font-semibold">Register</Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
        <h1 className="text-5xl font-extrabold mb-4 leading-tight">Share rides.<br/>Save money.</h1>
        <p className="text-xl text-blue-100 max-w-xl mb-8">
          The official ridesharing platform for SLIET students. Find classmates headed to Sangrur and split auto costs.
        </p>
        <Link to="/register" className="px-8 py-4 bg-white text-blue-700 rounded-xl font-bold text-lg hover:bg-blue-50 transition shadow-lg">
          Get Started Free →
        </Link>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 max-w-3xl w-full text-left">
          {[
            { icon: '🎓', title: 'Students only', desc: 'Verified @sliet.ac.in emails ensure a safe community.' },
            { icon: '💰', title: 'Split the cost', desc: 'Auto to Sangrur costs less when you share with 3 others.' },
            { icon: '⚡', title: 'Realtime updates', desc: 'Get notified instantly when seats fill up or rides are confirmed.' },
          ].map((f) => (
            <div key={f.title} className="bg-white/10 backdrop-blur rounded-xl p-5">
              <div className="text-3xl mb-2">{f.icon}</div>
              <h3 className="font-bold text-lg">{f.title}</h3>
              <p className="text-blue-100 text-sm mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
