import * as RadixDialog from "@radix-ui/react-dialog";
import { IconX } from "@tabler/icons-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function CourtDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  tone = "dark",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  tone?: "dark" | "paper";
}) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-ink/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <RadixDialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 flex max-h-[88vh] w-[min(640px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 flex-col gap-5 overflow-y-auto rounded-2xl p-6 shadow-2xl focus:outline-none court-scroll",
            tone === "paper"
              ? "exhibit-paper"
              : "border border-line-strong bg-bench text-foreground",
            className,
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <RadixDialog.Title className="font-display text-2xl font-semibold tracking-tight">
                {title}
              </RadixDialog.Title>
              {description ? (
                <RadixDialog.Description
                  className={cn(
                    "text-sm",
                    tone === "paper" ? "text-paper-muted" : "text-muted-foreground",
                  )}
                >
                  {description}
                </RadixDialog.Description>
              ) : (
                <RadixDialog.Description className="sr-only">Dialog</RadixDialog.Description>
              )}
            </div>
            <RadixDialog.Close
              aria-label="Close"
              className={cn(
                "inline-flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass",
                tone === "paper" ? "hover:bg-paper-dim" : "hover:bg-accent",
              )}
            >
              <IconX className="size-5" aria-hidden="true" />
            </RadixDialog.Close>
          </div>
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

export const fieldClass =
  "w-full rounded-lg border border-line-strong bg-ink px-3.5 py-2.5 text-[15px] text-foreground placeholder:text-muted-foreground/70 transition-colors focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass/30";

export const primaryButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-[1.5px] border-brass bg-brass px-6 text-[15px] font-semibold text-primary-foreground shadow-[3px_3px_0_hsl(52_100%_60%)] transition-[transform,box-shadow] hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_hsl(52_100%_60%)] active:translate-x-px active:translate-y-px active:shadow-none disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-defense focus-visible:ring-offset-2 focus-visible:ring-offset-ink";

export const ghostButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-[1.5px] border-brass bg-bench px-5 text-sm font-semibold text-foreground transition-colors hover:bg-brass-deep disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-defense";
