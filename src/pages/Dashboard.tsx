import React, { useMemo, useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/firebase/config";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  doc,
  deleteDoc,
} from "firebase/firestore";

interface Session {
  id: string;
  name: string;
  createdAt: Timestamp;
}

export default function Dashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sessionName, setSessionName] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "sessions"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const sessionsData: Session[] = [];
        querySnapshot.forEach((doc) => {
          sessionsData.push({ ...doc.data(), id: doc.id } as Session);
        });
        setSessions(sessionsData);
        setLoading(false);
      }, 
      (error) => {
        console.error("Firestore listener error:", error);
        toast({
          title: "Error loading sessions",
          description: "Could not fetch data from the database. Please check the console.",
          variant: "destructive",
        });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const canAdd = sessionName.trim().length > 1;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = sessionName.trim();
    if (!name) return;

    try {
      const docRef = await addDoc(collection(db, "sessions"), {
        name,
        createdAt: serverTimestamp(),
        code: `// Welcome to ${name}!\n\nconsole.log("Hello, World!");`,
        selectedRuntimeIndex: '0',
      });
      toast({ title: "Session created", description: `Joining “${name}”...` });
      setSessionName("");
      navigate(`/session/${docRef.id}`);
    } catch (error) {
      console.error("Error creating session:", error);
      toast({ title: "Error", description: "Could not create session.", variant: "destructive" });
    }
  };

  const handleJoin = (s: Session) => {
    toast({ title: "Joining session", description: `Connecting to “${s.name}”...` });
    navigate(`/session/${s.id}`);
  };

  const handleDelete = async (sessionId: string, sessionName: string) => {
    try {
      const sessionDocRef = doc(db, "sessions", sessionId);
      await deleteDoc(sessionDocRef);
      toast({
        title: "Session Deleted",
        description: `“${sessionName}” has been successfully removed.`,
      });
    } catch (error) {
      console.error("Error deleting session:", error);
      toast({
        title: "Error",
        description: "Could not delete the session.",
        variant: "destructive",
      });
    }
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
        <meta name="description" content="Dashboard to create and join AI-driven collaborative coding sessions." />
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      <main className="container py-10 md:py-12">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Dashboard: Manage Sessions</h1>
          <p className="text-muted-foreground mt-2">Create a session and invite others to collaborate in real time.</p>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-[var(--shadow-elevated)]">
            <CardHeader>
              <CardTitle>Create a new session</CardTitle>
              <CardDescription>Name your session and click add. You can join immediately after creating.</CardDescription>
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
                  <Button type="submit" disabled={!canAdd} aria-label="Add session">Add & Join Session</Button>
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
                  {loading && <TableCaption>Loading sessions...</TableCaption>}
                  {!loading && sessions.length === 0 && <TableCaption>No sessions yet. Create one!</TableCaption>}
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
                          {s.createdAt ? new Date(s.createdAt.toDate()).toLocaleString() : 'Just now'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="hero" onClick={() => handleJoin(s)}>
                              Join
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(s.id, s.name)}
                            >
                              Delete
                            </Button>
                          </div>
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
