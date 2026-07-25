import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Dots } from "../dots"

const gameButtonStyles = [
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center gap-2",
  "rounded-2xl border-0 bg-clip-padding",
  "font-cause font-extrabold tracking-wide whitespace-nowrap text-white",
  "shadow-[0_6px_0_0] transition-[transform,box-shadow,filter,background-color] duration-100 outline-none select-none",
  "hover:brightness-105",
  "active:translate-y-[6px] active:shadow-none",
  "disabled:cursor-not-allowed",
  "disabled:bg-zinc-300 disabled:shadow-none disabled:hover:bg-zinc-300 disabled:hover:brightness-100",
  "disabled:active:translate-y-0 disabled:active:shadow-none",
  "disabled:text-zinc-100",
  "data-disabled:cursor-not-allowed",
  "data-disabled:bg-zinc-300 data-disabled:shadow-none data-disabled:hover:bg-zinc-300 data-disabled:hover:brightness-100",
  "data-disabled:active:translate-y-0 data-disabled:active:shadow-none",
  "data-disabled:text-zinc-100",
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  "[&_svg]:[filter:drop-shadow(1px_4px_0_rgb(0_0_0_/_40%))_drop-shadow(-1px_4px_0_rgb(0_0_0_/_40%))_drop-shadow(0_4px_0_rgb(0_0_0_/_40%))_drop-shadow(0_4'px_0_rgb(0_0_0_/_40%))_drop-shadow(0_4px_0_rgb(0_0_0_/_5%))_drop-shadow(0_1px_1px_rgb(0_4px_4px_/_5%))_drop-shadow(0_4px_2px_rgb(0_0_0_/_5%))]",
  "disabled:[&_svg]:[filter:drop-shadow(1px_0_0_rgb(113_113_122_/_50%))_drop-shadow(-1px_0_0_rgb(113_113_122_/_50%))_drop-shadow(0_1px_0_rgb(113_113_122_/_50%))_drop-shadow(0_-1px_0_rgb(113_113_122_/_50%))]",
  "data-disabled:[&_svg]:[filter:drop-shadow(1px_0_0_rgb(113_113_122_/_50%))_drop-shadow(-1px_0_0_rgb(113_113_122_/_50%))_drop-shadow(0_1px_0_rgb(113_113_122_/_50%))_drop-shadow(0_-1px_0_rgb(113_113_122_/_50%))]",
].join(" ")

const buttonVariants = cva("", {
  variants: {
    variant: {
      normal: "",
      blue: `${gameButtonStyles} bg-sky-400 shadow-sky-700 hover:bg-sky-300`,
      green: `${gameButtonStyles} bg-green-400 shadow-green-700 hover:bg-green-300`,
      orange: `${gameButtonStyles} bg-orange-400 shadow-orange-700 hover:bg-orange-300`,
      red: `${gameButtonStyles} bg-red-400 shadow-red-700 hover:bg-red-300`,
      white: `${gameButtonStyles} border border-black/10 bg-white shadow-zinc-400 hover:bg-zinc-50 text-black`,
    },
    size: {
      sm: [
        "h-9 px-5 text-base",
        "shadow-[0_4px_0_0] active:translate-y-[4px]",
        "disabled:active:shadow-none data-disabled:active:shadow-none",
        "[&_svg:not([class*='size-'])]:size-3.5",
      ].join(" "),
      normal: "h-12 px-8 text-xl",
      icon: "size-12 p-0 inline-flex items-center justify-center rounded-lg hover:bg-black/10",
    },
  },
  defaultVariants: {
    variant: "blue",
    size: "normal",
  },
})

type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>

const gameVariants = new Set<ButtonVariant>(["blue", "green", "orange", "red", "white"])

function Button({
  className,
  variant = "blue",
  size = "normal",
  loading = false,
  children,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants> & { loading?: boolean }) {
  const isGame = variant != null && gameVariants.has(variant)

  const button = (
    <ButtonPrimitive
      data-slot="button"
      data-loading={loading}
      className={cn(
        buttonVariants({ variant, size }),
        isGame && "w-full",
        className
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Dots className="text-gray-600 size-7" /> : children}
    </ButtonPrimitive>
  )

  if (!isGame) {
    return button
  }

  return (
    <div
      className={cn(
        "inline-flex w-fit items-center justify-center rounded-3xl border-4 bg-black/10",
        "has-focus-visible:ring-3 has-focus-visible:ring-black/25",
        "has-disabled:pb-0 has-data-disabled:pb-0",
        size === "icon" ? "p-0" : size === "sm" ? "pb-1" : "pb-1.5",
        className
      )}
    >
      {button}
    </div>
  )
}

export { Button, buttonVariants }
