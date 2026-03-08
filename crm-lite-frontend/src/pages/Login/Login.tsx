import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../config/api';
import { Lock, Mail, ArrowRight } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('admin@crm.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // @ts-ignore
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(API_ENDPOINTS.auth.login, { email, password });
      
      if (res.data.success) {
        login(res.data.data.token, res.data.data);
        toast.success(`Welcome back, ${res.data.data.name}!`);
        navigate(from, { replace: true });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background aesthetics */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[100px] pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sm:mx-auto sm:w-full sm:max-w-md z-10"
      >
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <span className="text-2xl font-bold font-heading text-white tracking-tight">CRM Lite</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white font-heading">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Welcome back! Please enter your details.
          </p>
        </div>

        <div className="bg-slate-800/80 backdrop-blur-md py-8 px-4 shadow-xl shadow-black/20 rounded-2xl sm:px-10 border border-slate-700/50 relative overflow-hidden">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                Email address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 text-sm text-white bg-slate-700/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-500 outline-none transition-all"
                  placeholder="admin@crm.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 text-sm text-white bg-slate-700/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-500 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-500 focus:ring-indigo-500 border-slate-600 rounded bg-slate-700"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-300">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <button type="button" className="font-medium text-indigo-400 hover:text-indigo-300">
                  Forgot your password?
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-800 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/30 disabled:opacity-70 disabled:cursor-not-allowed group"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign in <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-800 text-slate-500">Demo Credentials</span>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-center">
              <button 
                type="button"
                onClick={() => { setEmail('admin@crm.com'); setPassword('password123'); }}
                className="bg-slate-700/50 p-3 rounded-lg border border-slate-600 hover:border-indigo-500/50 hover:bg-slate-700 transition-all cursor-pointer"
              >
                <p className="font-medium text-white">Admin</p>
                <p className="text-slate-400 mt-0.5">admin@crm.com</p>
              </button>
              <button 
                type="button"
                onClick={() => { setEmail('sales@crm.com'); setPassword('password123'); }}
                className="bg-slate-700/50 p-3 rounded-lg border border-slate-600 hover:border-indigo-500/50 hover:bg-slate-700 transition-all cursor-pointer"
              >
                <p className="font-medium text-white">Sales Rep</p>
                <p className="text-slate-400 mt-0.5">sales@crm.com</p>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
