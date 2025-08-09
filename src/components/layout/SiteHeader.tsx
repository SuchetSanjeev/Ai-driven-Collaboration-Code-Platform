import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/theme/ThemeToggle";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container flex h-16 items-center justify-between">
        <Link to="/" className="font-bold text-lg leading-none">
          <span className="bg-gradient-to-r from-[hsl(var(--gradient-hero-start))] to-[hsl(var(--gradient-hero-end))] bg-clip-text text-transparent">
            CollabCode AI
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost">
            <Link to="/login">Log in</Link>
          </Button>
          <Button asChild variant="hero">
            <Link to="/signup">Sign up</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}
