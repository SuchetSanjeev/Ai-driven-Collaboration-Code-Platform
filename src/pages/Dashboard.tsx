import React, { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Session {
  id: string;
  name: string;
  createdAt: number;
}

export default function Dashboard() {
  const { toast } = useToast();
  const [sessionName, setSessionName] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);

  const canAdd = sessionName.trim().length > 1;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const name = sessionName.trim();
    if (!name) return;
    const newSession: Session = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      createdAt: Date.now(),
    };
    setSessions((prev) => [newSession, ...prev]);
    setSessionName("");
    toast({ title: "Session created", description: `“${name}” is ready.`, });
  };

  const handleJoin = (s: Session) => {
    toast({
      title: "Joining session",
      description: `Connecting to “${s.name}”. (Demo)`,
    });
    // Navigate or open connection here when backend is ready
  };

  const canonicalUrl = useMemo(() => {
    if (typeof window === "undefined") return "/dashboard";
    const url = new URL(window.location.href);
    url.pathname = "/dashboard";
    url.search = "";
    url.hash = "";
    return url.toString();
  }, []);

  return (
    <>
      <Helmet>
        <title>Dashboard – Manage AI Coding Sessions</title>
        <meta
          name="description"
          content="Dashboard to create and join AI-driven collaborative coding sessions. Manage rooms and start collaborating in real time."
        />
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      <main className="container py-10 md:py-12">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Dashboard: Manage Sessions
          </h1>
          <p className="text-muted-foreground mt-2">
            Create a session and invite others to collaborate in real time.
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-[var(--shadow-elevated)]">
            <CardHeader>
              <CardTitle>Create a new session</CardTitle>
              <CardDescription>
                Name your session and click add. You can join immediately after creating.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="flex flex-col sm:flex-row gap-3" onSubmit={handleAdd}>
                <div className="grid gap-2 flex-1">
                  <Label htmlFor="session-name">Session name</Label>
                  <Input
                    id="session-name"
                    placeholder="e.g., Sprint Planning Room"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    aria-label="Session name"
                  />
                </div>
                <div className="flex items-end">
                  <Button type="submit" disabled={!canAdd} aria-label="Add session">
                    Add Session
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="shadow-[var(--shadow-elevated)]">
            <CardHeader>
              <CardTitle>Recent sessions</CardTitle>
              <CardDescription>Join any session to start collaborating.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  {sessions.length === 0 && (
                    <TableCaption>No sessions yet. Create your first session.</TableCaption>
                  )}
                  <TableHeader>
                    <TableRow>
                      <TableHead>Session</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell>
                          {new Date(s.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="hero" onClick={() => handleJoin(s)}>
                            Join
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </>
  );
}
