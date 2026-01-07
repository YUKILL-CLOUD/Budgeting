import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Wallet, ArrowRight, Lock, Mail, KeyRound } from 'lucide-react';

export const AuthPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mode, setMode] = useState<'signin' | 'signup' | 'magiclink'>('signin');
    const [magicLinkSent, setMagicLinkSent] = useState(false);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.includes('@')) {
            toast.error('Please enter a valid email');
            return;
        }

        setLoading(true);

        // Magic Link Flow
        if (mode === 'magiclink') {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: window.location.origin,
                },
            });
            if (error) {
                toast.error(error.message);
            } else {
                setMagicLinkSent(true);
                toast.success('Magic link sent! Check your email.');
            }
            setLoading(false);
            return;
        }

        // Password Flow
        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            setLoading(false);
            return;
        }

        if (mode === 'signup') {
            const { error } = await supabase.auth.signUp({
                email,
                password,
            });
            if (error) {
                toast.error(error.message);
            } else {
                toast.success('Account created! Please check your email to confirm.');
                setMode('signin');
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

    if (magicLinkSent) {
        return (
            <div className="auth-container">
                <div className="auth-card success">
                    <div className="auth-icon-box success">
                        <Mail size={32} />
                    </div>
                    <h2>Check your email</h2>
                    <p>We've sent a magic login link to <br /><strong className="highlight-text">{email}</strong></p>
                    <button
                        className="btn-text-start-over"
                        onClick={() => setMagicLinkSent(false)}
                    >
                        Use a different email
                    </button>
                    <button
                        className="btn-text-link mt-4"
                        onClick={() => { setMagicLinkSent(false); setMode('signin'); }}
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

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

                    {mode !== 'magiclink' && (
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
                    )}

                    <button type="submit" disabled={loading} className="btn-auth-submit">
                        {loading
                            ? 'Processing...'
                            : (mode === 'signup' ? 'Create Account' : mode === 'magiclink' ? 'Send Magic Link' : 'Sign In')
                        }
                        {!loading && <ArrowRight size={18} />}
                    </button>

                    <div className="auth-mode-toggle">
                        {mode === 'signin' && (
                            <>
                                <button type="button" className="btn-text-link mb-2" onClick={() => setMode('magiclink')}>
                                    Forgot password? / Use Magic Link
                                </button>
                                <p>
                                    Don't have an account?
                                    <button type="button" className="btn-text-link" onClick={() => setMode('signup')}>
                                        Sign Up
                                    </button>
                                </p>
                            </>
                        )}

                        {mode === 'signup' && (
                            <p>
                                Already have an account?
                                <button type="button" className="btn-text-link" onClick={() => setMode('signin')}>
                                    Sign In
                                </button>
                            </p>
                        )}

                        {mode === 'magiclink' && (
                            <button type="button" className="btn-text-link" onClick={() => setMode('signin')}>
                                Back to Password Login
                            </button>
                        )}
                    </div>
                </form>

                <p className="auth-footer">
                    <Lock size={12} /> Secure login provided by Supabase
                </p>
            </div>
        </div>
    );
};
