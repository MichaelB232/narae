import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type PointerEvent as ReactPointerEvent,
    type ReactNode,
} from "react";

export interface CarouselDay {
    dateISO: string;
    title: string;
    subtitle: string;
    content: ReactNode;
}

const DRAG_THRESHOLD = 6;

export function DayCarousel({ days }: { days: CarouselDay[] }) {
    const trackRef = useRef<HTMLDivElement>(null);
    const [index, setIndex] = useState(0);

    const drag = useRef({
        active: false,
        moved: false,
        startX: 0,
        startScroll: 0,
    });

    const goTo = useCallback((next: number) => {
        const track = trackRef.current;
        if (!track) return;
        const clamped = Math.max(0, Math.min(next, days.length - 1));
        track.scrollTo({ left: clamped * track.clientWidth, behavior: "smooth" });
    }, [days.length]);

    useEffect(() => {
        const track = trackRef.current;
        if (!track) return;

        let frame = 0;
        const onScroll = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                if (track.clientWidth === 0) return;
                const next = Math.round(track.scrollLeft / track.clientWidth);
                setIndex((prev) => (prev === next ? prev : next));
            });
        };

        track.addEventListener("scroll", onScroll, { passive: true });
        return () => {
            cancelAnimationFrame(frame);
            track.removeEventListener("scroll", onScroll);
        };
    }, []);

    function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
        if (e.pointerType !== "mouse" || e.button !== 0) return;
        const track = trackRef.current;
        if (!track) return;
        drag.current = {
            active: true,
            moved: false,
            startX: e.clientX,
            startScroll: track.scrollLeft,
        };
    }

    function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
        const state = drag.current;
        const track = trackRef.current;
        if (!state.active || !track) return;

        const delta = e.clientX - state.startX;
        if (!state.moved && Math.abs(delta) < DRAG_THRESHOLD) return;

        if (!state.moved) {
            state.moved = true;
            track.setPointerCapture(e.pointerId);
            track.style.scrollSnapType = "none";
            track.style.cursor = "grabbing";
        }
        track.scrollLeft = state.startScroll - delta;
    }

    function endDrag(e: ReactPointerEvent<HTMLDivElement>) {
        const state = drag.current;
        const track = trackRef.current;
        if (!state.active || !track) return;

        state.active = false;
        if (!state.moved) return;

        if (track.hasPointerCapture(e.pointerId)) {
            track.releasePointerCapture(e.pointerId);
        }
        track.style.scrollSnapType = "";
        track.style.cursor = "";

        const delta = e.clientX - state.startX;
        const width = track.clientWidth;
        const base = Math.round(state.startScroll / width);
        const step = Math.abs(delta) > width * 0.15 ? (delta < 0 ? 1 : -1) : 0;
        goTo(base + step);
    }

    function suppressClickAfterDrag(e: React.MouseEvent) {
        if (drag.current.moved) {
            e.preventDefault();
            e.stopPropagation();
            drag.current.moved = false;
        }
    }

    const current = days[index] ?? days[0];

    return (
        <div>
            <div className="mb-3 flex items-center justify-between gap-2">
                <button
                    type="button"
                    aria-label="Hari sebelumnya"
                    disabled={index === 0}
                    onClick={() => goTo(index - 1)}
                    className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full border border-line bg-surface text-sm text-navy transition active:scale-95 disabled:cursor-default disabled:opacity-30"
                >
                    ‹
                </button>

                <div className="min-w-0 flex-1 text-center">
                    <div className="truncate text-[15px] font-bold text-ink">{current.title}</div>
                    <div className="text-xs text-mute">{current.subtitle}</div>
                </div>

                <button
                    type="button"
                    aria-label="Hari berikutnya"
                    disabled={index === days.length - 1}
                    onClick={() => goTo(index + 1)}
                    className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full border border-line bg-surface text-sm text-navy transition active:scale-95 disabled:cursor-default disabled:opacity-30"
                >
                    ›
                </button>
            </div>

            <div
                ref={trackRef}
                className="no-scrollbar flex cursor-grab snap-x snap-mandatory overflow-x-auto overscroll-x-contain select-none"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                onClickCapture={suppressClickAfterDrag}
            >
                {days.map((day) => (
                    <div
                        key={day.dateISO}
                        className="w-full shrink-0 snap-center snap-always"
                    >
                        {day.content}
                    </div>
                ))}
            </div>

            <div className="mt-3 flex items-center justify-center gap-1.5">
                {days.map((day, i) => (
                    <button
                        key={day.dateISO}
                        type="button"
                        aria-label={`Lihat ${day.title}`}
                        onClick={() => goTo(i)}
                        className={`h-1.5 cursor-pointer rounded-full transition-all ${i === index ? "w-5 bg-navy" : "w-1.5 bg-[#c9cdd3]"
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}