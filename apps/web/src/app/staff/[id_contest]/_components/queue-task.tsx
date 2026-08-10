import { Blob } from "@/components/pouf/media";
import { BalloonIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export default function QueueTask() {
    return (
        <div className="flex h-full min-h-0 min-w-0 flex-7 flex-col gap-4 overflow-hidden rounded-3xl border-4 border-blue bg-white p-4">
            <div className="flex shrink-0 items-center gap-3">
                <Blob
                    icon={
                        <HugeiconsIcon
                            icon={BalloonIcon}
                            strokeWidth={2.5}
                        />
                    }
                    size="sm"
                    tone="blue"
                />
                <span className="text-xl font-bold">Tarefas</span>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
                Tasks
            </div>
        </div>
    )
}
