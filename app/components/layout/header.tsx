import { Link } from "react-router";
import { Button } from "../ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link className="mr-6 flex items-center space-x-2" to="/">
            <div className="h-6 w-6 rounded bg-primary" />
            <span className="hidden font-bold sm:inline-block">
              AI Dataset Creator
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              className="transition-colors hover:text-foreground/80 text-foreground"
              to="/projects"
            >
              Projects
            </Link>
            <Link
              className="transition-colors hover:text-foreground/80 text-foreground/60"
              to="/datasets"
            >
              Datasets
            </Link>
            <Link
              className="transition-colors hover:text-foreground/80 text-foreground/60"
              to="/templates"
            >
              Templates
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <Button variant="outline" className="h-8 w-8 p-0 md:hidden">
              <span className="sr-only">Open menu</span>
              ☰
            </Button>
          </div>
          <nav className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
            <Button size="sm">Get Started</Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
