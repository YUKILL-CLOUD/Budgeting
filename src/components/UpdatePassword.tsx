import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Lock, ArrowRight, KeyRound } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4">
            <Card className="w-full max-w-md bg-[#1e293b] border-white/10 shadow-2xl">
                <CardHeader className="text-center space-y-4 pb-6">
                    <div className="mx-auto w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center">
                        <KeyRound className="text-indigo-400" size={32} />
                    </div>
                    <CardTitle className="text-2xl text-white">Set New Password</CardTitle>
                    <CardDescription className="text-slate-400">Enter your new password below.</CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-slate-300">New Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-10 bg-slate-800 border-white/10 text-white placeholder:text-slate-500"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold py-6 text-base shadow-lg"
                        >
                            {loading ? 'Updating...' : 'Update Password'}
                            {!loading && <ArrowRight className="ml-2" size={18} />}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};
