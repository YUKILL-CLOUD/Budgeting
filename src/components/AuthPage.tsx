import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Wallet, ArrowRight, Lock, Mail } from 'lucide-react';

export const AuthPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [isSent, setIsSent] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.includes('@')) {
            toast.error('Please enter a valid email');
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: window.location.origin,
            },
        });

        if (error) {
            toast.error(error.message);
        } else {
            setIsSent(true);
            toast.success('Magic link sent! Check your email.');
        }
        setLoading(false);
    };

    if (isSent) {
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
                        onClick={() => setIsSent(false)}
                    >
                        Use a different email
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

                <form onSubmit={handleLogin} className="auth-form">
                    <div className="input-group-auth">
                        <label>Sign in to continue</label>
                        <div className="input-wrapper-auth">
                            <Mail size={18} className="input-icon" />
                            <input
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                                autoFocus
                            />
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="btn-auth-submit">
                        {loading ? 'Sending link...' : 'Send Magic Link'}
                        {!loading && <ArrowRight size={18} />}
                    </button>
                </form>

                <p className="auth-footer">
                    <Lock size={12} /> Secure passwordless login provided by Supabase
                </p>
            </div>
        </div>
    );
};
