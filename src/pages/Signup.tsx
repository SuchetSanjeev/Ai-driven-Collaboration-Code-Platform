import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { signUpWithEmail } from "@/firebase/auth"; // Assuming you created this file
import { FirebaseError } from "firebase/app";

export default function Signup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Call the Firebase authentication function
      await signUpWithEmail(email, password);

      toast({
        title: "Account Created!",
        description: "Please log in to continue.",
      });

      // Redirect to the login page after successful signup
      navigate("/login");

    } catch (error) {
      // Handle Firebase errors specifically
      let description = "An unexpected error occurred. Please try again.";
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case "auth/email-already-in-use":
            description = "This email is already in use. Please log in instead.";
            break;
          case "auth/invalid-email":
            description = "Please enter a valid email address.";
            break;
          case "auth/weak-password":
            description = "The password is too weak. It must be at least 6 characters long.";
            break;
          default:
            description = error.message;
            break;
        }
      }
      
      toast({
        title: "Signup Failed",
        description: description,
        variant: "destructive",
      });
      console.error("Firebase signup error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <Helmet>
        <title>Sign up — AI Realtime Collaborative Coding | CollabCode AI</title>
        <meta name="description" content="Create your CollabCode AI account to start coding together with realtime AI assistance." />
        <link rel="canonical" href={`${origin}/signup`} />
      </Helmet>
      <section className="container flex items-center justify-center py-16">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Create your account</CardTitle>
            <CardDescription>Start collaborating in seconds.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading} variant="hero">
                {loading ? "Creating account..." : "Create account"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Already have an account?</p>
            <Button asChild variant="link">
              <Link to="/login">Log in</Link>
            </Button>
          </CardFooter>
        </Card>
      </section>
    </main>
  );
}
