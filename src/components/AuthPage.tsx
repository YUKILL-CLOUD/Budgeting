import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Wallet, ArrowRight, Lock, Mail, KeyRound } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const AuthPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mode, setMode] = useState<'signin' | 'signup' | 'recovery'>('signin');
    const [recoverySent, setRecoverySent] = useState(false);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.includes('@')) {
            toast.error('Please enter a valid email');
            return;
        }

        setLoading(true);

        if (mode === 'recovery') {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/update-password`,
            });
            if (error) {
                toast.error(error.message);
            } else {
                setRecoverySent(true);
                toast.success('Recovery email sent!');
            }
            setLoading(false);
            return;
        }

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

    if (recoverySent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4">
                <Card className="w-full max-w-md bg-[#1e293b] border-white/10 shadow-2xl">
                    <CardHeader className="text-center space-y-4 pb-8">
                        <div className="mx-auto w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center">
                            <Mail className="text-emerald-400" size={32} />
                        </div>
                        <CardTitle className="text-2xl text-white">Check your email</CardTitle>
                        <CardDescription className="text-slate-400">
                            We've sent a password reset link to<br />
                            <strong className="text-emerald-400">{email}</strong>
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="justify-center">
                        <Button
                            variant="ghost"
                            className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
                            onClick={() => { setRecoverySent(false); setMode('signin'); }}
                        >
                            Back to Login
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4">
            <Card className="w-full max-w-md bg-[#1e293b] border-white/10 shadow-2xl">
                <CardHeader className="text-center space-y-4 pb-6">
                    <div className="mx-auto w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Wallet className="text-white" size={40} />
                    </div>
                    <div>
                        <CardTitle className="text-3xl font-black text-white mb-2">ZeroBudget</CardTitle>
                        <CardDescription className="text-slate-400">Master your money, zero complications.</CardDescription>
                    </div>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleAuth} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-300">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    className="pl-10 bg-slate-800 border-white/10 text-white placeholder:text-slate-500"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={loading}
                                    required
                                />
                            </div>
                        </div>

                        {mode !== 'recovery' && (
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-slate-300">Password</Label>
                                <div className="relative">
                                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
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
                        )}

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold py-6 text-base shadow-lg"
                        >
                            {loading
                                ? 'Processing...'
                                : (mode === 'signup' ? 'Create Account' : mode === 'recovery' ? 'Send Reset Link' : 'Sign In')
                            }
                            {!loading && <ArrowRight className="ml-2" size={18} />}
                        </Button>

                        <div className="space-y-2 text-center pt-2">
                            {mode === 'signin' && (
                                <>
                                    <Button
                                        type="button"
                                        variant="link"
                                        className="text-slate-400 hover:text-indigo-400 h-auto p-0"
                                        onClick={() => setMode('recovery')}
                                    >
                                        Forgot password?
                                    </Button>
                                    <p className="text-sm text-slate-500">
                                        Don't have an account?{' '}
                                        <Button
                                            type="button"
                                            variant="link"
                                            className="text-indigo-400 hover:text-indigo-300 h-auto p-0"
                                            onClick={() => setMode('signup')}
                                        >
                                            Sign Up
                                        </Button>
                                    </p>
                                </>
                            )}

                            {mode === 'signup' && (
                                <p className="text-sm text-slate-500">
                                    Already have an account?{' '}
                                    <Button
                                        type="button"
                                        variant="link"
                                        className="text-indigo-400 hover:text-indigo-300 h-auto p-0"
                                        onClick={() => setMode('signin')}
                                    >
                                        Sign In
                                    </Button>
                                </p>
                            )}

                            {mode === 'recovery' && (
                                <Button
                                    type="button"
                                    variant="link"
                                    className="text-slate-400 hover:text-indigo-400 h-auto p-0"
                                    onClick={() => setMode('signin')}
                                >
                                    Back to Login
                                </Button>
                            )}
                        </div>
                    </form>
                </CardContent>

                <CardFooter className="justify-center border-t border-white/5 pt-6">
                    <p className="text-xs text-slate-500 flex items-center gap-2">
                        <Lock size={12} /> Secure login provided by Supabase
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
};
