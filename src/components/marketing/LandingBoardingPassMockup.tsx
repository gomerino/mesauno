import { cn } from "@/components/jurnex-ui/cn";
import { Plane, RefreshCw } from "lucide-react";

/** Navy del pase demo (alineado con referencia visual tipo aerolínea). */
export const LANDING_BOARDING_NAVY = "#0a1128";

type Density = "compact" | "comfortable";

type Props = {
  density?: Density;
  className?: string;
  /** Sin radios ni sombra abajo: para pegar una franja navy debajo (hero). */
  flushBottom?: boolean;
};

/**
 * Pase demo para marketing: mismas zonas que el producto (cabecera oscura, cuerpo blanco, datos, QR).
 * Tipografía sans neutra y rejilla en dos columnas como el ticket impreso.
 */
export function LandingBoardingPassMockup({ density = "compact", className, flushBottom = false }: Props) {
  const c = density === "comfortable";
  const headPad = c ? "px-4 pb-4 pt-3.5" : "px-3 pb-3 pt-2.5";
  const bpLabel = c ? "text-[10px] tracking-[0.28em]" : "text-[8px] tracking-[0.22em]";
  const nameSize = c ? "text-lg sm:text-xl" : "text-sm";
  const flightSize = c ? "text-[11px]" : "text-[9px]";
  const bodyPad = c ? "px-4 pb-4 pt-4" : "px-3 pb-3 pt-3";
  const codeSize = c ? "text-[1.35rem] leading-none sm:text-2xl" : "text-lg";
  const citySize = c ? "text-[11px] leading-snug" : "text-[9px]";
  const gridLabel = c ? "text-[10px]" : "text-[8px]";
  const gridVal = c ? "text-[13px]" : "text-[11px]";
  const qrPx = c ? 104 : 80;
  const footerInstr = c ? "text-[10px] tracking-[0.14em]" : "text-[8px] tracking-[0.12em]";

  return (
    <div
      className={cn(
        "overflow-hidden border border-black/25 bg-white font-sans shadow-[0_16px_48px_-12px_rgba(0,0,0,0.65)]",
        flushBottom ? "rounded-t-[1.35rem] rounded-b-none border-b-0 shadow-none" : "rounded-[1.35rem]",
        className,
      )}
      aria-hidden
    >
      <div className={cn("text-white", headPad)} style={{ backgroundColor: LANDING_BOARDING_NAVY }}>
        <div className="flex items-center justify-between gap-3">
          <p className={cn("font-semibold uppercase text-white", bpLabel)}>Boarding pass</p>
          <div
            className={cn(
              "flex shrink-0 items-center justify-center rounded-full border border-white/40 bg-white/5",
              c ? "h-9 w-9" : "h-7 w-7",
            )}
            aria-hidden
          >
            <RefreshCw className={cn("text-white", c ? "h-4 w-4" : "h-3 w-3")} strokeWidth={1.65} />
          </div>
        </div>
        <p className={cn("mt-3 font-bold uppercase leading-none tracking-[0.06em] text-white", nameSize)}>Juan Perez</p>
        <p className={cn("mt-2 font-normal text-white/90", flightSize)}>Vuelo: JX-2024</p>
      </div>

      <div className={cn("border-t border-dashed border-neutral-300/90 bg-white text-black", bodyPad)}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 text-left">
            <p className={cn("font-bold tabular-nums tracking-tight text-black", codeSize)}>SCL</p>
            <p className={cn("mt-1 font-medium text-neutral-700", citySize)}>Santiago de Chile</p>
          </div>
          <div className="flex shrink-0 translate-y-1 justify-center px-0.5">
            <Plane className={cn("text-black", c ? "h-6 w-6" : "h-5 w-5")} strokeWidth={1.75} aria-hidden />
          </div>
          <div className="min-w-0 flex-1 text-right">
            <p className={cn("font-bold tabular-nums tracking-tight text-black", codeSize)}>MDZ</p>
            <p className={cn("mt-1 font-medium text-neutral-700", citySize)}>Mendoza, Argentina</p>
          </div>
        </div>

        <div
          className={cn(
            "mt-4 grid grid-cols-2 gap-x-0",
            c ? "border-t border-neutral-200 pt-4" : "border-t border-neutral-200 pt-3",
          )}
        >
          <div className="border-r border-dotted border-neutral-300 pr-3">
            <div>
              <p className={cn("font-bold uppercase tracking-wide text-neutral-600", gridLabel)}>Fecha</p>
              <p className={cn("mt-1 font-bold tabular-nums text-black", gridVal)}>12 OCT 2024</p>
            </div>
            <div className={c ? "mt-4" : "mt-3"}>
              <p className={cn("font-bold uppercase tracking-wide text-neutral-600", gridLabel)}>Puerta</p>
              <p className={cn("mt-1 font-bold tabular-nums text-black", gridVal)}>G12</p>
            </div>
          </div>
          <div className="pl-3">
            <div>
              <p className={cn("font-bold uppercase tracking-wide text-neutral-600", gridLabel)}>Hora</p>
              <p className={cn("mt-1 font-bold tabular-nums text-black", gridVal)}>18:30</p>
            </div>
            <div className={c ? "mt-4" : "mt-3"}>
              <p className={cn("font-bold uppercase tracking-wide text-neutral-600", gridLabel)}>Asiento</p>
              <p className={cn("mt-1 font-bold tabular-nums text-black", gridVal)}>14A</p>
            </div>
          </div>
        </div>

        <div className={c ? "my-4" : "my-3"}>
          <div className="border-t border-dashed border-neutral-400" />
        </div>

        <LandingDemoQr size={qrPx} />

        <p className={cn("mt-4 text-center font-semibold uppercase text-neutral-600", footerInstr)}>
          Presenta este pase al ingresar
        </p>
      </div>
    </div>
  );
}

/** QR decorativo con patrones buscadores como un código real (solo landing). */
function LandingDemoQr({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 29 29"
      className="mx-auto block rounded bg-white text-black ring-1 ring-neutral-900/15"
      aria-hidden
    >
      <rect width="29" height="29" fill="#ffffff" />
      <g fill="#0a0a0a">
        <LandingQrFinder x={2} y={2} />
        <LandingQrFinder x={18} y={2} />
        <LandingQrFinder x={2} y={18} />
        {LANDING_DEMO_QR_BITS.map(([cx, cy]) => (
          <rect key={`${cx}-${cy}`} x={cx} y={cy} width="1" height="1" />
        ))}
      </g>
    </svg>
  );
}

function LandingQrFinder({ x, y }: { x: number; y: number }) {
  return (
    <>
      <rect x={x} y={y} width={7} height={7} />
      <rect x={x + 1} y={y + 1} width={5} height={5} fill="#ffffff" />
      <rect x={x + 2} y={y + 2} width={3} height={3} />
    </>
  );
}

/** Módulos “datos” fijos (coordenadas en grilla 29×29, zona central). */
const LANDING_DEMO_QR_BITS: readonly [number, number][] = [
  [10, 10],
  [11, 10],
  [13, 10],
  [14, 10],
  [15, 10],
  [16, 10],
  [10, 11],
  [12, 11],
  [14, 11],
  [16, 11],
  [17, 11],
  [10, 12],
  [11, 12],
  [13, 12],
  [15, 12],
  [17, 12],
  [11, 13],
  [12, 13],
  [14, 13],
  [16, 13],
  [10, 14],
  [13, 14],
  [15, 14],
  [17, 14],
  [10, 15],
  [11, 15],
  [14, 15],
  [16, 15],
  [12, 16],
  [13, 16],
  [15, 16],
  [17, 16],
  [10, 17],
  [11, 17],
  [14, 17],
  [16, 17],
  [10, 18],
  [12, 18],
  [13, 18],
  [15, 18],
  [17, 18],
  [11, 19],
  [14, 19],
  [16, 19],
  [10, 20],
  [12, 20],
  [15, 20],
  [17, 20],
  [13, 21],
  [14, 21],
  [16, 21],
];
