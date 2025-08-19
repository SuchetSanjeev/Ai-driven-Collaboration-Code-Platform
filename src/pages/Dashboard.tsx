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
  collection, addDoc, onSnapshot, query, orderBy, serverTimestamp,
  Timestamp, doc, deleteDoc, where
} from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext"; // Import the useAuth hook

interface Session {
  id: string;
  name: string;
  createdAt: Timestamp;
  ownerId: string; // Ensure ownerId is part of the interface
}

export default function Dashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { currentUser } = useAuth(); // Get the currently logged-in user
  const [sessionName, setSessionName] = useState("");
  const [joinSessionId, setJoinSessionId] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  // --- UPDATED: This effect now depends on currentUser ---
  useEffect(() => {
    // If there's no user, we can't fetch their sessions.
    if (!currentUser) {
      setSessions([]); // Clear any previous sessions
      setLoading(false);
      return;
    }

    setLoading(true);
    // This query is now user-specific. It requires the Firestore index you created.
    const q = query(
      collection(db, "sessions"),
      where("ownerId", "==", currentUser.uid), // Filter by the logged-in user's ID
      orderBy("createdAt", "desc")
    );
    
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
          title: "Error",
          description: "Could not fetch your sessions. Please check the console.",
          variant: "destructive",
        });
        setLoading(false);
      }
    );

    // Cleanup the listener when the component unmounts or the user changes
    return () => unsubscribe();
  }, [currentUser, toast]); // Re-run when the user logs in or out

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      toast({ title: "Not Authenticated", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    const name = sessionName.trim();
    if (!name) return;

    try {
      // Add ownerId when creating the session
      const docRef = await addDoc(collection(db, "sessions"), {
        name,
        createdAt: serverTimestamp(),
        code: `// Welcome to ${name}!\n\nconsole.log("Hello, World!");`,
        selectedRuntimeIndex: '0',
        ownerId: currentUser.uid, // Tag the session with the user's ID
      });
      toast({ title: "Session created", description: `Joining “${name}”...` });
      setSessionName("");
      navigate(`/session/${docRef.id}`);
    } catch (error) {
      console.error("Error creating session:", error);
    }
  };

  const handleJoinById = (e: React.FormEvent) => {
    e.preventDefault();
    const idToJoin = joinSessionId.trim();
    if (idToJoin) {
        navigate(`/session/${idToJoin}`);
    }
  };

  const handleDelete = async (sessionId: string, sessionName: string) => {
    try {
      await deleteDoc(doc(db, "sessions", sessionId));
      toast({ title: "Session Deleted", description: `“${sessionName}” was removed.` });
    } catch (error) {
      console.error("Error deleting session:", error);
    }
  };
  
  const canAdd = sessionName.trim().length > 1;

  return (
    <main className="container py-10 md:py-12">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          {currentUser ? `Welcome back! Here are your sessions.` : "Please log in to manage your sessions."}
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-md lg:col-span-1">
          <CardHeader>
            <CardTitle>Manage Sessions</CardTitle>
            <CardDescription>Create a new session or join one by its ID.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form className="space-y-3" onSubmit={handleAdd}>
              <Label htmlFor="session-name">Create a new session</Label>
              <div className="flex gap-2">
                <Input id="session-name" placeholder="My New Project" value={sessionName} onChange={(e) => setSessionName(e.target.value)} />
                <Button type="submit" disabled={!canAdd}>Create</Button>
              </div>
            </form>
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or</span></div>
            </div>
            <form className="space-y-3" onSubmit={handleJoinById}>
              <Label htmlFor="session-id">Join by ID</Label>
              <div className="flex gap-2">
                <Input id="session-id" placeholder="Paste session ID here" value={joinSessionId} onChange={(e) => setJoinSessionId(e.target.value)} />
                <Button type="submit" variant="secondary" disabled={!joinSessionId.trim()}>Join</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-md lg:col-span-2">
          <CardHeader>
            <CardTitle>Your Recent Sessions</CardTitle>
            <CardDescription>These are the collaborative sessions you have created.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                {loading && <TableCaption>Loading your sessions...</TableCaption>}
                {!loading && sessions.length === 0 && <TableCaption>You haven't created any sessions yet.</TableCaption>}
                <TableHeader>
                  <TableRow>
                    <TableHead>Session Name</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.createdAt ? new Date(s.createdAt.toDate()).toLocaleString() : 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" onClick={() => navigate(`/session/${s.id}`)}>Join</Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(s.id, s.name)}>Delete</Button>
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
  );
}
