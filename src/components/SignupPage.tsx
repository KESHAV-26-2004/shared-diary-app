//src/components/SignupPage.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Lock, ArrowLeft, Heart } from "lucide-react";
import diaryBackground from "@/assets/diary-background.jpg";

import { createUserWithEmailAndPassword,sendEmailVerification } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/firebase";

interface SignupPageProps {
  onSignup: (name: string, email: string, password: string) => void;
  onBackToLogin: (message?: string) => void;
}

const SignupPage = ({ onSignup, onBackToLogin }: SignupPageProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onSignup(name, email, password); // start signup mode
    setError("");
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 1️⃣ create Firestore user
      await setDoc(doc(db, "user", user.uid), {
        name,
        email,
        createdAt: new Date(),
        groupIds: [],
      });

      // 2️⃣ send verification email
      await sendEmailVerification(user, {
        url: window.location.origin,
      });

      // 3️⃣ logout
      await auth.signOut();

      onBackToLogin("📩 Verification email sent! Please check your inbox or spam before logging in.");

    } catch (err: any) {

      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered.");
      } 
      else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      }
      else if (err.code === "auth/weak-password") {
        setError("Password must be at least 6 characters.");
      }
      else {
        setError("Signup failed. Please try again.");
      }

    } finally {
      setLoading(false);
    }
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
            Join our warm community of diary writers
          </p>
        </div>

        <Card className="bg-gradient-card border-diary-pink/20 shadow-soft">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-diary">Create Account</CardTitle>
            <CardDescription>
              Start your journey with us today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Display Name</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white/80 border-diary-pink/30 focus:border-primary transition-smooth"
                  required
                />
              </div>

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

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <Button 
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-soft transition-smooth"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-4">
              <Button
                variant="ghost"
                onClick={() => onBackToLogin()}
                className="w-full flex items-center justify-center space-x-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Login</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignupPage;
