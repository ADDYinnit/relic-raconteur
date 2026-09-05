import { Link, useNavigate } from "@tanstack/react-router";
import { Compass, Landmark, LogOut, MapPinned, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function SiteHeader() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link to="/" className="mr-auto flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Landmark className="size-4.5" />
          </span>
          <span className="font-display text-2xl leading-none font-semibold tracking-tight">
            Antiquary
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          <Button asChild variant="ghost" size="sm">
            <Link to="/gallery">
              <Compass className="size-4" />
              <span className="hidden sm:inline">Gallery</span>
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/map">
              <MapPinned className="size-4" />
              <span className="hidden sm:inline">Map</span>
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/upload">
              <Upload className="size-4" />
              <span className="hidden sm:inline">Add artifact</span>
            </Link>
          </Button>
          {user ? (
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out">
              <LogOut className="size-4" />
            </Button>
          ) : (
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
