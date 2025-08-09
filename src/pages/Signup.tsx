import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

export default function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: Wire up Supabase auth when configured in this project
    await new Promise((r) => setTimeout(r, 700));
    setLoading(false);
    toast({ title: "Account created", description: "Demo signup successful. Check your inbox to confirm when auth is connected." });
    navigate("/");
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
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading} variant="hero">
                {loading ? "Creating account..." : "Create account"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Already have an account?</p>
            <Button asChild variant="link"><Link to="/login">Log in</Link></Button>
          </CardFooter>
        </Card>
      </section>
    </main>
  );
}
