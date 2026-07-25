import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Dots } from "../dots"

const gameButtonHitStyles = [
  "group/button relative inline-flex w-full shrink-0 cursor-pointer items-stretch justify-center",
  "border-0 bg-transparent p-0 outline-none select-none",
  "disabled:cursor-not-allowed data-disabled:cursor-not-allowed",
].join(" ")

const gameButtonFaceStyles = [
  "pointer-events-none inline-flex size-full items-center justify-center gap-2",
  "rounded-2xl border-0 bg-clip-padding",
  "font-cause font-extrabold tracking-wide whitespace-nowrap text-white",
  "shadow-[0_6px_0_0] transition-[transform,box-shadow,filter,background-color] duration-100",
  "group-hover/button:brightness-105",
  "group-active/button:translate-y-[6px] group-active/button:shadow-none",
  "group-disabled/button:cursor-not-allowed",
  "group-disabled/button:bg-zinc-300 group-disabled/button:shadow-none",
  "group-disabled/button:group-hover/button:bg-zinc-300 group-disabled/button:group-hover/button:brightness-100",
  "group-disabled/button:group-active/button:translate-y-0 group-disabled/button:group-active/button:shadow-none",
  "group-disabled/button:text-zinc-100",
  "group-data-disabled/button:bg-zinc-300 group-data-disabled/button:shadow-none",
  "group-data-disabled/button:group-hover/button:bg-zinc-300 group-data-disabled/button:group-hover/button:brightness-100",
  "group-data-disabled/button:group-active/button:translate-y-0 group-data-disabled/button:group-active/button:shadow-none",
  "group-data-disabled/button:text-zinc-100",
  "[&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
].join(" ")

const buttonVariants = cva("", {
  variants: {
    variant: {
      normal: "",
      blue: "bg-sky-400 shadow-sky-700 group-hover/button:bg-sky-300",
      green: "bg-green-400 shadow-green-700 group-hover/button:bg-green-300",
      orange: "bg-orange-400 shadow-orange-700 group-hover/button:bg-orange-300",
      red: "bg-red-400 shadow-red-700 group-hover/button:bg-red-300",
      white:
        "border border-black/10 bg-white shadow-zinc-400 text-black group-hover/button:bg-zinc-50",
    },
    size: {
      sm: [
        "h-9 px-5 text-base",
        "shadow-[0_4px_0_0] group-active/button:translate-y-[4px]",
        "[&_svg:not([class*='size-'])]:size-3.5",
      ].join(" "),
      normal: "h-12 px-8 text-xl",
      icon: "size-12 p-0 inline-flex items-center justify-center rounded-lg",
    },
  },
  defaultVariants: {
    variant: "blue",
    size: "normal",
  },
})

const normalButtonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg outline-none select-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      size: {
        sm: "h-9 px-5 text-base [&_svg:not([class*='size-'])]:size-3.5",
        normal: "h-12 px-8 text-xl",
        icon: "size-12 p-0 hover:bg-black/10",
      },
    },
    defaultVariants: {
      size: "normal",
    },
  },
)

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
  const content = loading ? <Dots className="text-gray-600 size-7" /> : children

  if (!isGame) {
    return (
      <ButtonPrimitive
        data-slot="button"
        data-loading={loading}
        className={cn(normalButtonVariants({ size }), className)}
        disabled={loading || props.disabled}
        {...props}
      >
        {content}
      </ButtonPrimitive>
    )
  }

  const depthClass = size === "sm" ? "pb-1" : "pb-1.5"

  return (
    <div
      className={cn(
        "inline-flex w-fit items-center justify-center rounded-3xl border-4 bg-black/10",
        "has-focus-visible:ring-3 has-focus-visible:ring-black/25",
        size === "icon" ? "p-0" : undefined,
        className,
      )}
    >
      <ButtonPrimitive
        data-slot="button"
        data-loading={loading}
        className={cn(gameButtonHitStyles, size === "icon" ? "p-0" : depthClass)}
        disabled={loading || props.disabled}
        {...props}
      >
        <span
          className={cn(
            gameButtonFaceStyles,
            buttonVariants({ variant, size }),
          )}
        >
          {content}
        </span>
      </ButtonPrimitive>
    </div>
  )
}

export { Button, buttonVariants }
