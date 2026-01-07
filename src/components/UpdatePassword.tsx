import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Lock, ArrowRight, KeyRound } from 'lucide-react';

export const UpdatePassword: React.FC = () => {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Ensure we have a session (handled by the recovery link automatically logging them in)
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                toast.error('Invalid or expired recovery link.');
                window.location.href = '/';
            }
        });
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
