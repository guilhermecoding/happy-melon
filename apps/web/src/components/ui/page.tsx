import { cn } from "@/lib/utils";

/**
 * Componente de página.
 * @param children - Os filhos do componente.
 */
export default function Page({
    children,
    className,
    ...props
}: React.ComponentPropsWithoutRef<"main">) {
    return (
        <main className={cn("w-full min-w-0 flex-1 pt-6 pb-12 @container/main", className)} {...props}>
            {children}
        </main>
    );
}