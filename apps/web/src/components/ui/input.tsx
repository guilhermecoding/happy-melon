import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({
  className,
  type,
  icon,
  ...props
}: React.ComponentProps<"input"> & {
  icon?: React.ReactNode
}) {
  const input = (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-xl border-3 border-input bg-gray-50 px-4 py-6 text-base transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        icon && "pl-11",
        className
      )}
      {...props}
    />
  )

  if (!icon) {
    return input
  }

  return (
    <div className="relative w-full" data-slot="input-group">
      <span
        data-slot="input-icon"
        className="pointer-events-none absolute top-1/2 left-3.5 z-10 -translate-y-1/2 text-muted-foreground [&_svg]:size-5 [&_svg]:shrink-0"
      >
        {icon}
      </span>
      {input}
    </div>
  )
}

export { Input }
