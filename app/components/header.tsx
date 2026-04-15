import { Form } from "react-router";
import { Database, LogOut } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { ThemeToggle } from "~/components/theme-toggle";

interface HeaderProps {
  authEnabled: boolean;
  endpoint: string;
}

export function Header({ authEnabled, endpoint }: HeaderProps) {
  return (
    <header className="h-14 border-b border-border bg-background flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
          <Database className="h-4 w-4 text-white" />
        </div>
        <span className="font-semibold text-lg">S3 Explorer</span>
        <Badge variant="secondary" className="text-xs font-normal">
          {endpoint}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        {authEnabled && (
          <Form method="post" action="/login?logout">
            <Button variant="ghost" size="icon" className="h-8 w-8" type="submit">
              <LogOut className="h-4 w-4" />
            </Button>
          </Form>
        )}
      </div>
    </header>
  );
}
