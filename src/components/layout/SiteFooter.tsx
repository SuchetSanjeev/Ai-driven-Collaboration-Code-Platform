export default function SiteFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} CollabCode AI. All rights reserved.</p>
        <nav className="flex items-center gap-6 text-sm">
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Terms</a>
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a>
        </nav>
      </div>
    </footer>
  );
}
