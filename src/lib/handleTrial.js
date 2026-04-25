import { base44 } from "@/api/base44Client";

export async function handleTrial(setLoading) {
  if (setLoading) setLoading(true);
  const isAuthed = await base44.auth.isAuthenticated();
  if (!isAuthed) {
    base44.auth.redirectToLogin("/onboarding");
    return;
  }
  window.location.href = "/onboarding";
}