import { NavLink } from "react-router";
import { Folder } from "lucide-react";
import { ScrollArea } from "~/components/ui/scroll-area";
import { cn } from "~/lib/utils";
import type { S3BucketItem } from "~/lib/s3.server";

interface SidebarProps {
  buckets: S3BucketItem[];
}

export function Sidebar({ buckets }: SidebarProps) {
  return (
    <aside className="w-64 border-r border-border/40 bg-sidebar flex flex-col">
      <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
        <span className="text-sm font-medium text-sidebar-foreground">Buckets</span>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {buckets.map((bucket) => (
            <NavLink
              key={bucket.name}
              to={`/${bucket.name}`}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )
              }
            >
              <Folder className="h-4 w-4 shrink-0 text-cyan-400" />
              <span className="truncate">{bucket.name}</span>
            </NavLink>
          ))}
        </div>
      </ScrollArea>
      <div className="px-4 py-2 border-t border-border/40">
        <p className="text-[11px] text-muted-foreground">{buckets.length} buckets</p>
      </div>
    </aside>
  );
}
