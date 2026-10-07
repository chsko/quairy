import { AuthCardSkeleton, AuthPage } from "@/components/AuthPage";

export default function Loading() {
  return (
    <AuthPage>
      <AuthCardSkeleton label="Loading sign up…" />
    </AuthPage>
  );
}
