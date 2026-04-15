import { Link } from "react-router";
import { ChevronRight, Home } from "lucide-react";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import React from "react";

interface BreadcrumbNavProps {
  bucket: string;
  prefix: string;
}

export function BreadcrumbNav({ bucket, prefix }: BreadcrumbNavProps) {
  const parts = prefix.split("/").filter(Boolean);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to={`/${bucket}`} className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors">
              <Home className="h-3.5 w-3.5" />
              {bucket}
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {parts.map((part, index) => {
          const pathPrefix = parts.slice(0, index + 1).join("/") + "/";
          return (
            <React.Fragment key={pathPrefix}>
              <BreadcrumbSeparator>
                <ChevronRight className="h-3.5 w-3.5" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={`/${bucket}/${pathPrefix}`} className="hover:text-cyan-400 transition-colors">
                    {part}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
