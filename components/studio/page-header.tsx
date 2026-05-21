import { cn } from "@/lib/utils";

interface Props {
  title: string;
  description?: string;
  className?: string;
}

export function PageHeader({ title, description, className }: Props) {
  return (
    <div className={cn("mb-6 space-y-1", className)}>
      <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
        {title}
      </h1>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
