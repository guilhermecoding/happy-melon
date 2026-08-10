import { WorkoutRunIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export default function LobbyArea() {
    return (
        <div className="flex h-full min-h-0 min-w-0 flex-4 flex-col gap-3 overflow-hidden rounded-3xl border-4 border-slate-950 bg-slate-950 p-3">
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
