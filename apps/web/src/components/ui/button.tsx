import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "group/button inline-flex shrink-0 cursor-pointer items-center justify-center",
    "rounded-full border-0 bg-clip-padding",
    "font-black tracking-wide whitespace-nowrap text-white",
    "[-webkit-text-stroke:1.75px_black] [paint-order:stroke_fill]",
    "[text-shadow:0_2px_0_rgb(0_0_0_/_35%)]",
    "shadow-[0_6px_0_0_var(--btn-edge)] transition-[transform,box-shadow,filter] duration-100 outline-none select-none",
    "hover:brightness-105",
    "active:translate-y-[6px] active:shadow-[0_0_0_0_var(--btn-edge)]",
    "focus-visible:ring-3 focus-visible:ring-black/25",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        blue: "[--btn-edge:#0077C2] bg-[#00A8FF] hover:bg-[#33B9FF]",
        green: "[--btn-edge:#2F9E44] bg-[#51CF66] hover:bg-[#69DB7C]",
        orange: "[--btn-edge:#E67700] bg-[#FF922B] hover:bg-[#FFA94D]",
        red: "[--btn-edge:#C92A2A] bg-[#FF6B6B] hover:bg-[#FF8787]",
        white: "[--btn-edge:#ADB5BD] bg-white hover:bg-zinc-50 border-black/10 border",
      },
      size: {
        default: "h-12 px-8 text-base",
        sm: "h-9 px-5 text-sm [-webkit-text-stroke:1.25px_black]",
        lg: "h-14 px-10 text-lg [-webkit-text-stroke:2px_black]",
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
  variant = "white",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Button, buttonVariants }
