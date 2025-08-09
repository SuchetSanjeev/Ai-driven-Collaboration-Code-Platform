import { Helmet } from "react-helmet-async";
import heroLaptop from "@/assets/hero-laptop.jpg";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Bot, Users2, Sparkles } from "lucide-react";

const Index = () => {
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { currentTarget, clientX, clientY } = e;
    const rect = (currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    (currentTarget as HTMLDivElement).style.setProperty("--mx", `${x}%`);
    (currentTarget as HTMLDivElement).style.setProperty("--my", `${y}%`);
  };

  return (
    <main className="min-h-screen bg-background">
      <Helmet>
        <title>AI Realtime Collaborative Coding Platform | CollabCode AI</title>
        <meta name="description" content="Code together instantly with AI pair-programming, realtime cursors, and zero-setup cloud dev environments." />
        <link rel="canonical" href={`${origin}/`} />
      </Helmet>
      <section
        className="relative border-b"
        onMouseMove={handleMouseMove}
        aria-label="Hero"
      >
        <div className="absolute inset-0 pointer-events-none [background:radial-gradient(600px_circle_at_var(--mx,50%)_var(--my,20%),hsl(var(--primary)/0.15),transparent_55%)]" />
        <div className="container grid lg:grid-cols-2 gap-10 py-20 items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-full border bg-secondary">
              <Sparkles className="opacity-80" /> <span className="text-muted-foreground">New</span>
              <span className="font-medium"> AI pair-programmer built-in</span>
            </span>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
              AI-driven realtime collaborative coding
            </h1>
            <p className="text-lg text-muted-foreground max-w-prose">
              Build together in the browser with multi-cursor editing, smart code suggestions, and voice-enabled commands. No setup, just a link.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild variant="hero" size="lg">
                <a href="/signup">Start free</a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="/login">Log in</a>
              </Button>
            </div>
            <ul className="grid sm:grid-cols-2 gap-3 pt-4 text-sm">
              <li className="flex items-center gap-2 text-muted-foreground"><CheckCircle2 className="text-primary" />Realtime cursors & presence</li>
              <li className="flex items-center gap-2 text-muted-foreground"><CheckCircle2 className="text-primary" />AI inline suggestions</li>
              <li className="flex items-center gap-2 text-muted-foreground"><CheckCircle2 className="text-primary" />Secure cloud workspaces</li>
              <li className="flex items-center gap-2 text-muted-foreground"><CheckCircle2 className="text-primary" />One-click sharing</li>
            </ul>
          </div>
          <div className="relative flex justify-center lg:justify-end">
            <img
              src={heroLaptop}
              alt="Laptop with code and connected nodes representing AI collaboration"
              className="w-full max-w-xs lg:max-w-sm rounded-xl border shadow-[var(--shadow-elevated)] ring-1 ring-[hsl(var(--border)/0.6)]"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <section id="features" className="container py-16 md:py-24">
        <div className="grid md:grid-cols-3 gap-6">
          <article className="group rounded-xl border bg-card p-6 shadow-sm shadow-[var(--shadow-elevated)] transition-transform duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-glow)]">
            <div className="flex items-center gap-3 mb-3">
              <Bot />
              <h2 className="text-xl font-semibold">Built-in AI pair programmer</h2>
            </div>
            <p className="text-muted-foreground">Explain, refactor, generate tests, and translate code across languages with context-aware AI.</p>
          </article>
          <article className="group rounded-xl border bg-card p-6 shadow-sm shadow-[var(--shadow-elevated)] transition-transform duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-glow)]">
            <div className="flex items-center gap-3 mb-3">
              <Users2 />
              <h2 className="text-xl font-semibold">True realtime collaboration</h2>
            </div>
            <p className="text-muted-foreground">See teammates’ cursors, selections, and edits instantly with low-latency sync.</p>
          </article>
          <article className="group rounded-xl border bg-card p-6 shadow-sm shadow-[var(--shadow-elevated)] transition-transform duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-glow)]">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles />
              <h2 className="text-xl font-semibold">Zero setup, cloud-native</h2>
            </div>
            <p className="text-muted-foreground">Spin up secure containers per project and share a link. Works on any device.</p>
          </article>
        </div>
      </section>
    </main>
  );
};

export default Index;
