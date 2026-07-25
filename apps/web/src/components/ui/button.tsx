import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Dots } from "../dots"

const buttonVariants = cva(
  [
    "group/button inline-flex shrink-0 cursor-pointer items-center justify-center gap-2",
    "rounded-2xl border-0 bg-clip-padding",
    "font-cause font-extrabold text-xl tracking-wide whitespace-nowrap text-white",
    "[-webkit-text-stroke:1.75px_black] [paint-order:stroke_fill]",
    "text-shadow-sm text-shadow-black/35",
    "shadow-[0_6px_0_0] transition-[transform,box-shadow,filter,background-color] duration-100 outline-none select-none",
    "hover:brightness-105",
    "active:translate-y-[6px] active:shadow-none",
    "focus-visible:ring-3 focus-visible:ring-black/25",
    "disabled:cursor-not-allowed",
    "disabled:bg-zinc-300 disabled:shadow-zinc-400 disabled:hover:bg-zinc-300 disabled:hover:brightness-100",
    "disabled:active:translate-y-0 disabled:active:shadow-[0_6px_0_0]",
    "disabled:text-zinc-100 disabled:[-webkit-text-stroke-color:theme(colors.zinc.500)]",
    "data-disabled:cursor-not-allowed",
    "data-disabled:bg-zinc-300 data-disabled:shadow-zinc-400 data-disabled:hover:bg-zinc-300 data-disabled:hover:brightness-100",
    "data-disabled:active:translate-y-0 data-disabled:active:shadow-[0_6px_0_0]",
    "data-disabled:text-zinc-100 data-disabled:[-webkit-text-stroke-color:theme(colors.zinc.500)]",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    "[&_svg]:[filter:drop-shadow(1px_0_0_rgb(0_0_0_/_40%))_drop-shadow(-1px_0_0_rgb(0_0_0_/_40%))_drop-shadow(0_1px_0_rgb(0_0_0_/_40%))_drop-shadow(0_-1px_0_rgb(0_0_0_/_40%))_drop-shadow(0_1.5px_0_rgb(0_0_0_/_25%))]",
    "disabled:[&_svg]:[filter:drop-shadow(1px_0_0_rgb(113_113_122_/_50%))_drop-shadow(-1px_0_0_rgb(113_113_122_/_50%))_drop-shadow(0_1px_0_rgb(113_113_122_/_50%))_drop-shadow(0_-1px_0_rgb(113_113_122_/_50%))]",
    "data-disabled:[&_svg]:[filter:drop-shadow(1px_0_0_rgb(113_113_122_/_50%))_drop-shadow(-1px_0_0_rgb(113_113_122_/_50%))_drop-shadow(0_1px_0_rgb(113_113_122_/_50%))_drop-shadow(0_-1px_0_rgb(113_113_122_/_50%))]",
  ].join(" "),
  {
    variants: {
      variant: {
        blue: "bg-sky-400 shadow-sky-700 hover:bg-sky-300",
        green: "bg-green-400 shadow-green-700 hover:bg-green-300",
        orange: "bg-orange-400 shadow-orange-700 hover:bg-orange-300",
        red: "bg-red-400 shadow-red-700 hover:bg-red-300",
        white: "border border-black/10 bg-white shadow-zinc-400 hover:bg-zinc-50",
        ghost: "bg-transparent hover:bg-muted/50",
      },
      size: {
        default: "h-12 px-8",
        sm: "h-9 px-5 [-webkit-text-stroke:1.25px_black]",
        lg: "h-14 px-10 [-webkit-text-stroke:2px_black]",
        icon: "size-12 p-0",
      },
    },
    defaultVariants: {
      variant: "blue",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "blue",
  size = "default",
  loading = false,
  children,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants> & { loading?: boolean }) {
  return (
    <ButtonPrimitive
      data-slot="button"
      data-loading={loading}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Dots className="text-gray-600 size-7" /> : children}
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }
