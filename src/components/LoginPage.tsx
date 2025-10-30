import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Mail, Lock } from "lucide-react";
import diaryBackground from "@/assets/diary-background.jpg";

import {
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "@/firebase";

interface LoginPageProps {
  onLogin: (email: string, password: string) => void;
  onSignup: () => void;
}

const LoginPage = ({ onLogin, onSignup }: LoginPageProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showResend, setShowResend] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setShowResend(false);
    setResetMessage("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        await auth.signOut();
        setError("📩 Please verify your email before logging in. Check your inbox or trash.");
        setShowResend(true);
        return;
      }

      onLogin(email, password);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleResend = async () => {
    try {
      setError("Sending verification email...");
      setShowResend(false);

      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        setError("✅ Verification email sent again. Check your inbox or trash!");
        await auth.signOut();
        return;
      }

      const tempUser = await signInWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(tempUser.user);
      await auth.signOut();

      setError("✅ Verification email sent again. Check your inbox or trash!");
    } catch (err: any) {
      console.error("Resend error:", err.message);
      setError("Could not resend. Try again later.");
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setResetMessage("⚠️ Please enter your email to reset password.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setResetMessage("✅ Password reset email sent! Check your inbox or spam.");
    } catch (err: any) {
      setResetMessage("❌ Error sending reset email. Check your email address.");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: `url(${diaryBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute inset-0 bg-gradient-warm/80"></div>
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Heart className="h-8 w-8 text-primary fill-current" />
            <h1 className="text-3xl font-bold text-foreground font-diary">Shared Diary</h1>
            <span className="text-2xl">💌</span>
          </div>
          <p className="text-muted-foreground">
            A warm space to share your thoughts with loved ones
          </p>
        </div>

        <Card className="bg-gradient-card border-diary-pink/20 shadow-soft">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-diary">Welcome Back</CardTitle>
            <CardDescription>Sign in to continue sharing your stories</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>Email</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/80 border-diary-pink/30 focus:border-primary transition-smooth"
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center space-x-2">
                  <Lock className="h-4 w-4" />
                  <span>Password</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/80 border-diary-pink/30 focus:border-primary transition-smooth"
                  required
                />

                {/* Forgot Password Link */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    className="text-blue-500 hover:text-blue-400 text-sm font-medium transition-smooth"
                  >
                    Forgot Password?
                  </button>
                </div>
                {resetMessage && (
                  <p className="text-xs text-center text-muted-foreground mt-1">{resetMessage}</p>
                )}
              </div>

              {error && <p className="text-red-500 text-sm text-center">{error}</p>}

              {/* Resend Email */}
              {showResend && (
                <div className="text-center">
                  <Button
                    variant="secondary"
                    onClick={handleResend}
                    className="mt-2 bg-blue-200 hover:bg-blue-400 text-black font-medium shadow-soft transition-smooth"
                  >
                    Resend Verification Email
                  </Button>
                </div>
              )}

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-soft transition-smooth"
              >
                Sign In
              </Button>
            </form>

            {/* Signup Link */}
            <div className="mt-4 text-center">
              <p className="text-sm font-medium">
                <span className="text-black">New User?</span>{" "}
                <button
                  onClick={onSignup}
                  className="text-blue-500 hover:text-blue-400 font-semibold underline-offset-2 hover:underline transition-smooth"
                >
                  Sign Up
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
