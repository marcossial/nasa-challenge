import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Thermometer,
  CloudRain,
  Wind,
  Droplets,
  Snowflake,
  Mountain,
  Leaf,
  FlaskConical,
  PanelLeftClose,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, API_CONFIGURED } from "@/services/api";
import { usePlatform } from "./PlatformContext";
import { DataState } from "./DataState";
import { soilLabels } from "@/services/fastapi";
import type { Indicator } from "@/services/contracts";
const labels: [string, string][] = [
  ["temperature", "Temperatura"],
  ["precipitation", "Precipitação"],
  ["humidity", "Umidade relativa"],
  ["wind", "Vento"],
  ["soil", "Umidade estimada do solo"],
  ["frost", "Geada potencial"],
  ["heat", "Calor excessivo"],
  ["altitude", "Altitude"],
  ...Object.entries(soilLabels),
];
const icons = [Thermometer, CloudRain, Droplets, Wind, Droplets, Snowflake, Thermometer, Mountain];
export function useSummary() {
  const { place } = usePlatform();
  const summary = useQuery({
    queryKey: ["summary", place],
    queryFn: () => api.summary(place),
    retry: false,
  });
  const enabled = API_CONFIGURED;
  const soil = useQuery({
    queryKey: ["soil", place],
    queryFn: () => api.soil(place),
    enabled,
    retry: false,
  });
  const terrain = useQuery({
    queryKey: ["terrain", place],
    queryFn: () => api.terrain(place),
    enabled,
    retry: false,
  });
  const risks = useQuery({
    queryKey: ["risks", place, undefined],
    queryFn: () => api.risks(place),
    enabled,
    retry: false,
  });
  const items = [
    ...(summary.data?.indicators ?? []),
    ...(soil.data ?? []),
    ...(terrain.data ?? []),
    ...(risks.data ?? [])
      .filter((risk) => risk.id === "frost" || risk.id === "heat")
      .map((risk): Indicator => ({
        id: risk.id,
        label: risk.name,
        value: risk.level === "Indisponível" ? null : risk.level,
        unit: "",
        source: risk.source,
        reference_date: risk.reference_date ?? null,
        status: risk.level === "Indisponível" ? "unavailable" : "available",
      })),
  ];
  return { summary, items };
}
export function IndicatorCard({ indicator, index = 0 }: { indicator: Indicator; index?: number }) {
  const Icon = index >= 8 ? FlaskConical : (icons[index] ?? Leaf);
  const available = indicator.status !== "unavailable" && indicator.value !== null;
  return (
    <article className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <Icon className="size-4 shrink-0 text-water" />
          {indicator.label}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {available
            ? indicator.status === "partial"
              ? "Parcial"
              : indicator.kind === "estimated"
                ? "Estimativa"
                : "Disponível"
            : "Indisponível"}
        </span>
      </div>
      <p className="my-2 font-mono text-xl font-semibold">
        {available ? indicator.value : "—"}{" "}
        <span className="text-xs font-normal text-muted-foreground">
          {available ? indicator.unit : ""}
        </span>
      </p>
      <p className="text-[10px] text-muted-foreground">
        {indicator.source || "Fonte não disponível"} ·{" "}
        {indicator.reference_date || "Sem data de referência"}
      </p>
    </article>
  );
}
export function InfoPanel({ onClose }: { onClose: () => void }) {
  const { place } = usePlatform();
  const { summary, items } = useSummary();
  const displayed = labels.map(
    ([id, label]) =>
      [...items].reverse().find((x) => x.id === id) ?? {
        id,
        label,
        value: null,
        unit: "",
        source: null,
        reference_date: null,
        status: "unavailable" as const,
      },
  );
  return (
    <aside className="absolute bottom-0 left-0 z-[1000] flex h-[55%] w-full sm:top-0 sm:h-full sm:w-[340px] sm:max-w-[calc(100vw-3rem)] flex-col border-r border-border bg-card shadow-panel">
      <header className="flex items-start gap-2 border-b border-border p-4">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase text-agriculture">Diagnóstico agroambiental</p>
          <h1 className="mt-1 truncate font-semibold" title={place.name}>
            {place.name}
          </h1>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">
            {place.lat.toFixed(4)}, {place.lon.toFixed(4)}
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Atualização:{" "}
            {summary.data?.updated_at
              ? new Date(summary.data.updated_at).toLocaleString("pt-BR")
              : "indisponível"}
          </p>
        </div>
        <Button variant="ghost" size="icon" aria-label="Fechar painel" onClick={onClose}>
          <PanelLeftClose />
        </Button>
      </header>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {summary.isPending && <DataState loading />}
        {summary.error && (
          <DataState error={summary.error.message} retry={() => summary.refetch()} />
        )}
        {displayed.map((indicator, index) => (
          <IndicatorCard key={indicator.id} indicator={indicator} index={index} />
        ))}
      </div>
      <footer className="space-y-2 border-t border-border p-3">
        <Button asChild className="w-full">
          <Link to="/dashboard">
            Monitoramento detalhado
            <ArrowRight />
          </Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link to="/plantio">
            Planejar plantio
            <Leaf />
          </Link>
        </Button>
      </footer>
    </aside>
  );
}
