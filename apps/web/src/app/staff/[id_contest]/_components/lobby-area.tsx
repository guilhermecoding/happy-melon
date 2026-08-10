import { WorkoutRunIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";

export default function LobbyArea() {
    return (
        <div
            className={cn(
                'fixed z-50 flex h-56 w-[min(100%-2rem,22rem)] flex-col gap-3 overflow-hidden rounded-3xl border-4 border-slate-700 bg-slate-700 p-2',
                'bottom-4 left-1/2 -translate-x-1/2',
                'lg:bottom-6 lg:left-auto lg:right-6 lg:translate-x-0',
            )}
        >
            <div className="flex shrink-0 items-center gap-1 text-white">
                <HugeiconsIcon icon={WorkoutRunIcon} strokeWidth={2.5} className="size-6" />
                <span className="font-bold text-xl">Lobby</span>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl bg-white p-2">
                Area
            </div>
        </div>
    )
}
