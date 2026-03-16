import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useProfile } from "./hooks/useQueries";
import { ProfileSetupDialog } from "./components/ProfileSetupDialog";
import { Dashboard } from "./components/Dashboard";
import { TripDetailPage } from "./components/TripDetailPage";
import { TemplateDetailPage } from "./components/TemplateDetailPage";
import { useActor } from "./hooks/useActor";

export default function App() {
  const [selectedTripId, setSelectedTripId] = useState<bigint | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<bigint | null>(
    null,
  );
  const { identity, isInitializing, login, clear, isLoggingIn } =
    useInternetIdentity();
  const { isFetching, actor } = useActor();
  const { data: profile, isLoading } = useProfile();

  const isAuthenticated = !!identity;
  const hasProfile = profile && profile.name;

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Initializing...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && !actor && (isFetching || isLoading)) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your data...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex flex-col bg-background">
        <section className="flex-1 flex items-center justify-center px-6 py-20 md:py-32">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            {/* Badge */}
            <span className="text-base text-primary bg-primary/20 border border-primary/30 px-5 py-2 rounded-full">
              Packt
            </span>

            {/* Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight text-balance">
              Never Forget an Essential Again
            </h1>

            {/* Subheading */}
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed text-balance">
              Intelligent packing lists tailored to your trips. Organize by
              bags, check items off, and travel with confidence.
            </p>

            <Button
              size="lg"
              onClick={login}
              disabled={isLoggingIn}
              className="rounded-full"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Logging in...
                </>
              ) : (
                "Login with Internet Identity"
              )}
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center py-4 text-slate-500 text-xs">
          © 2026. Built with ❤️ using{" "}
          <a
            href="https://caffeine.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-slate-300"
          >
            caffeine.ai
          </a>
        </footer>
      </main>
    );
  }

  return (
    <>
      <ProfileSetupDialog open={!hasProfile} />
      {hasProfile ? (
        selectedTripId !== null ? (
          <TripDetailPage
            tripId={selectedTripId}
            onBack={() => setSelectedTripId(null)}
          />
        ) : selectedTemplateId !== null ? (
          <TemplateDetailPage
            templateId={selectedTemplateId}
            onBack={() => setSelectedTemplateId(null)}
            onNavigateToTrip={(tripId) => {
              setSelectedTemplateId(null);
              setSelectedTripId(tripId);
            }}
          />
        ) : (
          <Dashboard
            userName={profile.name}
            onLogout={clear}
            onSelectTrip={(tripId) => setSelectedTripId(tripId)}
            onSelectTemplate={(templateId) => setSelectedTemplateId(templateId)}
          />
        )
      ) : (
        <div className="min-h-screen bg-background" />
      )}
    </>
  );
}
