import React, { useState } from 'react';
import { auth } from '../firebase';

interface AuthProps {
    onLogin: (user: any) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        if (!auth) {
            setError("Auth is not configured correctly.");
            setLoading(false);
            return;
        }

        try {
            if (isLogin) {
                const user = await auth.signIn(email, password);
                onLogin(user);
            } else {
                if (!fullName) {
                    setError("Full Name is required for sign up.");
                    setLoading(false);
                    return;
                }
                const user = await auth.signUp(email, password, fullName);
                onLogin(user);
            }
        } catch (err: any) {
            setError("An error occurred. Please check your details and try again.");
        } finally {
            setLoading(false);
        }
    };
    
    const AuthIcon: React.FC<{type: 'email' | 'password' | 'user'}> = ({ type }) => {
        const icons = {
            email: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
            password: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />,
            user: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        }
        return (
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {icons[type]}
            </svg>
        )
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 p-4">
            <div className="text-center text-white mb-8">
                <h1 className="text-5xl font-bold">HostelInsight</h1>
                <p className="text-xl opacity-90 mt-2">Your gateway to amazing hostel experiences</p>
            </div>
            <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8">
                <h2 className="text-3xl font-bold text-center text-gray-800">Welcome</h2>
                <p className="text-center text-gray-500 mt-2">Sign in to your account or create a new one</p>

                <div className="mt-6 grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg">
                    <button
                        onClick={() => { setIsLogin(true); setError(null); }}
                        className={`w-full py-2 rounded-md text-sm font-semibold transition-all duration-300 ${isLogin ? 'bg-white shadow text-violet-600' : 'text-gray-500 hover:bg-gray-200'}`}
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => { setIsLogin(false); setError(null); }}
                        className={`w-full py-2 rounded-md text-sm font-semibold transition-all duration-300 ${!isLogin ? 'bg-white shadow text-violet-600' : 'text-gray-500 hover:bg-gray-200'}`}
                    >
                        Sign Up
                    </button>
                </div>

                <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
                    {!isLogin && (
                         <div>
                            <label htmlFor="full-name" className="block text-sm font-medium text-gray-700">Full Name</label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <AuthIcon type="user" />
                                </div>
                                <input
                                    id="full-name"
                                    name="fullname"
                                    type="text"
                                    required
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-violet-500 focus:border-violet-500 sm:text-sm"
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>
                    )}
                    <div>
                        <label htmlFor="email-address" className="block text-sm font-medium text-gray-700">Email</label>
                         <div className="mt-1 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <AuthIcon type="email" />
                            </div>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-violet-500 focus:border-violet-500 sm:text-sm"
                                placeholder="you@example.com"
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                         <div className="mt-1 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <AuthIcon type="password" />
                            </div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-violet-500 focus:border-violet-500 sm:text-sm"
                                placeholder={isLogin ? "Enter your password" : "Create a password (min 6 characters)"}
                            />
                        </div>
                    </div>

                     {isLogin && (
                        <div className="text-right">
                            <a href="#" className="text-sm font-medium text-violet-600 hover:text-violet-500">
                                Forgot your password?
                            </a>
                        </div>
                    )}

                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:bg-violet-400"
                        >
                            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                        </button>
                    </div>
                </form>
                <p className="text-center text-xs text-gray-400 mt-6">
                    By continuing, you agree to our terms and privacy policy
                </p>
            </div>
        </div>
    );
};

export default Auth;
