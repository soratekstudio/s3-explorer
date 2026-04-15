import { Search, X } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";

interface SearchFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchFilter({ value, onChange }: SearchFilterProps) {
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
      <Input
        placeholder="Filter files..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-48 pl-8 pr-8 text-sm"
      />
      {value && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0.5 top-1/2 -translate-y-1/2 h-7 w-7"
          onClick={() => onChange("")}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
