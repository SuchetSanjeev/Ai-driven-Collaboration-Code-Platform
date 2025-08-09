import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { signInWithEmail } from "@/firebase/auth"; // Assuming you created this file
import { FirebaseError } from "firebase/app";

export default function Login() {
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
      // Call the Firebase sign-in function
      await signInWithEmail(email, password);

      toast({
        title: "Welcome Back!",
        description: "You have been successfully logged in.",
      });

      // Redirect to the dashboard on successful login
      navigate("/dashboard");

    } catch (error) {
      // Handle Firebase errors
      let description = "An unexpected error occurred. Please try again.";
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case "auth/user-not-found":
          case "auth/wrong-password":
          case "auth/invalid-credential":
            description = "Invalid email or password. Please try again.";
            break;
          case "auth/invalid-email":
            description = "Please enter a valid email address.";
            break;
          default:
            description = "Failed to log in. Please check your credentials.";
            break;
        }
      }

      toast({
        title: "Login Failed",
        description: description,
        variant: "destructive",
      });
      console.error("Firebase login error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <Helmet>
        <title>
          Log in — AI Realtime Collaborative Coding | CollabCode AI
        </title>
        <meta
          name="description"
          content="Log in to CollabCode AI, the AI-driven realtime collaborative coding platform."
        />
        <link rel="canonical" href={`${origin}/login`} />
      </Helmet>
      <section className="container flex items-center justify-center py-16">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Log in</CardTitle>
            <CardDescription>
              Access your collaborative workspaces.
            </CardDescription>
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
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
                variant="default"
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">No account yet?</p>
            <Button asChild variant="link">
              <Link to="/signup">Create an account</Link>
            </Button>
          </CardFooter>
        </Card>
      </section>
    </main>
  );
}
