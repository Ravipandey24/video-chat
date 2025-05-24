"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { Loader2, User, Mail, Lock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DotPattern } from "@/components/magicui/dot-pattern";
import { cn } from "@/lib/utils";

// Registration form schema
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function RegisterPage() {
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Check if passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    // Validate form data
    try {
      registerSchema.parse({ name, email, password });
    } catch (error) {
      if (error instanceof z.ZodError) {
        setError(error.errors[0].message);
        return;
      }
    }

    try {
      setIsLoading(true);
      
      // Call registration API
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }
      
      // Registration successful, show success message
      setIsSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/auth/login?registered=true");
      }, 3000);
      
    } catch (error: any) {
      console.error("Registration error:", error);
      setError(error.message || "An error occurred during registration");
    } finally {
      setIsLoading(false);
    }
  };

  // Show success screen if registration was successful
  if (isSuccess) {
    return (
      <div className="relative flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden bg-background">
        <DotPattern
          className={cn(
            "absolute inset-0 text-primary/10 [mask-image:radial-gradient(900px_circle_at_center,white,transparent)]",
          )}
          glow={true}
          width={20}
          height={20}
        />
        
        <div className="z-10 w-full max-w-md">
          <Card className="overflow-hidden border border-primary/20 shadow-xl bg-gradient-to-b from-background/95 via-background/98 to-background backdrop-blur-md relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 rounded-xl opacity-30" />
            <CardHeader className="space-y-2 pb-6 px-8 pt-8">
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight text-center">Registration Successful!</CardTitle>
              <CardDescription className="text-muted-foreground/80 text-center">
                Your account has been created and is pending approval. You will be notified when your account is approved.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex flex-col gap-4 px-8 pb-8">
              <p className="text-center text-sm text-muted-foreground">
                Redirecting to login page...
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden bg-background">
      <DotPattern
        className={cn(
          "absolute inset-0 text-primary/10 [mask-image:radial-gradient(900px_circle_at_center,white,transparent)]",
        )}
        glow={true}
        width={20}
        height={20}
      />
      
      <div className="z-10 w-full max-w-md">
        <Card className="overflow-hidden border border-primary/20 shadow-xl bg-gradient-to-b from-background/95 via-background/98 to-background backdrop-blur-md relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 rounded-xl opacity-30" />
          <form onSubmit={handleSubmit}>
            <CardHeader className="space-y-2 pb-6 px-8 pt-8">
              <CardTitle className="text-2xl font-bold tracking-tight">Register for an Account</CardTitle>
              <CardDescription className="text-muted-foreground/80">
                Enter your information to register. All accounts require approval before access.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-5 pt-2 px-8">
              {error && (
                <Alert variant="destructive" className="border-destructive/30 text-destructive">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  <AlertDescription className="flex items-center">{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-medium tracking-tight" htmlFor="name">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-10 pl-9"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium tracking-tight" htmlFor="email">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-10 pl-9"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium tracking-tight" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-10 pl-9"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium tracking-tight" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-10 pl-9"
                  />
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col gap-4 px-8 pb-8">
              <Button 
                className="w-full h-11 font-medium shadow-sm transition-all" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Register Account"
                )}
              </Button>
              
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="text-primary font-medium hover:underline transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}