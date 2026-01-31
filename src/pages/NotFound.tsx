import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-muted-foreground mb-6">
        Sorry, the page you’re looking for doesn’t exist.
      </p>

      <Link
        to="/"
        className="px-4 py-2 rounded-md bg-primary text-primary-foreground"
      >
        Go Home
      </Link>
    </div>
  );
}
