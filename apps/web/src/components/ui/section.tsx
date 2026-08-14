import { cn } from "@/lib/utils";

/**
 * Componente de seção.
 * @param children - Os filhos do componente.
 */
export default function Section({
    children,
    className,
    ...props
}: React.ComponentPropsWithoutRef<"section">) {
    return (
        <section className={cn("w-full px-6 sm:px-13", className)} {...props}>
            {children}
        </section>
    );
}