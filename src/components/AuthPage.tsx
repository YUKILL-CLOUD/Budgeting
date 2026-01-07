import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Wallet, ArrowRight, Lock, Mail, KeyRound } from 'lucide-react';

export const AuthPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.includes('@')) {
            toast.error('Please enter a valid email');
            return;
        }
        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        if (mode === 'signup') {
            const { error } = await supabase.auth.signUp({
                email,
                password,
            });
            if (error) {
                toast.error(error.message);
            } else {
                toast.success('Account created! Please check your email to confirm.');
                setMode('signin'); // Switch to sign in view or keep them here
            }
        } else {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) {
                toast.error(error.message);
            } else {
                toast.success('Welcome back!');
            }
        }
        setLoading(false);
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="app-brand-large">
                    <div className="logo-box-large">
                        <Wallet size={40} />
                    </div>
                    <h1>ZeroBudget</h1>
                    <p className="subtitle">Master your money, zero complications.</p>
                </div>

                <div className="divider-h"></div>

                <form onSubmit={handleAuth} className="auth-form">
                    <div className="input-group-auth">
                        <label>Email</label>
                        <div className="input-wrapper-auth">
                            <Mail size={18} className="input-icon" />
                            <input
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group-auth">
                        <label>Password</label>
                        <div className="input-wrapper-auth">
                            <KeyRound size={18} className="input-icon" />
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="btn-auth-submit">
                        {loading
                            ? (mode === 'signin' ? 'Signing in...' : 'Creating account...')
                            : (mode === 'signin' ? 'Sign In' : 'Create Account')
                        }
                        {!loading && <ArrowRight size={18} />}
                    </button>

                    <div className="auth-mode-toggle">
                        <p>
                            {mode === 'signin' ? "Don't have an account?" : "Already have an account?"}
                            <button
                                type="button"
                                className="btn-text-link"
                                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                            >
                                {mode === 'signin' ? 'Sign Up' : 'Sign In'}
                            </button>
                        </p>
                    </div>
                </form>

                <p className="auth-footer">
                    <Lock size={12} /> Secure login provided by Supabase
                </p>
            </div>
        </div>
    );
};
