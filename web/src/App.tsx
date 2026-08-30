import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { SpaceListPage } from "./pages/SpaceListPage";
import { SpaceDetailPage } from "./pages/SpaceDetailPage";
import { UpdateBanner } from "./components/UpdateBanner";
import { FeedbackButton } from "./components/FeedbackButton";

// Lazy-loaded routes
const JoinPage = lazy(() => import("./pages/JoinPage").then((m) => ({ default: m.JoinPage })));

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-midnight flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-gold border-t-transparent animate-spin" />
    </div>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <>
      {children}
      <FeedbackButton />
    </>
  );
}

export function App() {
  return (
    <>
      <UpdateBanner />
      <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/spaces"
          element={
            <AuthGate>
              <SpaceListPage />
            </AuthGate>
          }
        />

        <Route
          path="/spaces/:spaceId"
          element={
            <AuthGate>
              <SpaceDetailPage />
            </AuthGate>
          }
        />

        <Route
          path="/join/:token"
          element={
            <AuthGate>
              <JoinPage />
            </AuthGate>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/spaces" replace />} />
      </Routes>
      </Suspense>
    </>
  );
}
