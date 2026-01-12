import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Lock, ArrowRight, KeyRound } from 'lucide-react';

export const UpdatePassword: React.FC = () => {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                // Give it one more try after a tiny delay in case hash parsing is slow
                setTimeout(async () => {
                    const { data: { secondSession } } = await supabase.auth.getSession() as any;
                    if (!secondSession && !window.location.hash.includes('access_token')) {
                        toast.error('Invalid or expired recovery link.');
                        window.location.href = '/';
                    }
                }, 500);
            }
        };
        checkSession();
    }, []);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.updateUser({ password: password });

        if (error) {
            toast.error(error.message);
        } else {
            toast.success('Password updated successfully!');
            // clear hash and redirect to home
            window.location.href = '/';
        }
        setLoading(false);
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-icon-box">
                    <KeyRound size={32} />
                </div>
                <h2>Set New Password</h2>
                <p className="subtitle">Enter your new password below.</p>

                <form onSubmit={handleUpdate} className="auth-form">
                    <div className="input-group-auth">
                        <label>New Password</label>
                        <div className="input-wrapper-auth">
                            <Lock size={18} className="input-icon" />
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
                        {loading ? 'Updating...' : 'Update Password'}
                        {!loading && <ArrowRight size={18} />}
                    </button>
                </form>
            </div>
        </div>
    );
};
