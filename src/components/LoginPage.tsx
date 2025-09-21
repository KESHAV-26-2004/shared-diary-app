import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Mail, Lock } from "lucide-react";
import diaryBackground from "@/assets/diary-background.jpg";

import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";

interface LoginPageProps {
  onLogin: (email: string, password: string) => void; // Pass email & password
  onSignup: () => void;
}


const LoginPage = ({ onLogin, onSignup }: LoginPageProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };


  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: `url(${diaryBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-gradient-warm/80"></div>
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Heart className="h-8 w-8 text-primary fill-current" />
            <h1 className="text-3xl font-bold text-foreground font-diary">
              Shared Diary
            </h1>
            <span className="text-2xl">💌</span>
          </div>
          <p className="text-muted-foreground">
            A warm space to share your thoughts with loved ones
          </p>
        </div>

        <Card className="bg-gradient-card border-diary-pink/20 shadow-soft">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-diary">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to continue sharing your stories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
              </div>

              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}

              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-soft transition-smooth"
              >
                Sign In
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Button
                variant="link"
                onClick={onSignup}
                className="text-accent hover:text-accent/80"
              >
                New User? Sign Up
              </Button>
            </div>

            <div className="mt-6 p-4 bg-diary-pink/30 rounded-lg border border-diary-pink/40">
              <p className="text-sm text-center text-muted-foreground">
                <span className="text-accent font-medium">⏳ Waiting for admin approval</span>
                <br />
                New users need approval from the admin before accessing the diary.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
