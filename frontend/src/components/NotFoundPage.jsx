import { useLocation } from "wouter";
import Button from "./ui/Button";
import AppLayout from "./AppLayout";
import EmptyState from "./ui/EmptyState";

export default function NotFoundPage() {
  const [, setLocation] = useLocation();
  return (
    <AppLayout>
      <EmptyState title="Page not found" description="The page you're looking for doesn't exist." />
      <Button variant="back" fullWidth onClick={() => setLocation("/")} className="mt-4">
        Go to main menu
      </Button>
    </AppLayout>
  );
}
