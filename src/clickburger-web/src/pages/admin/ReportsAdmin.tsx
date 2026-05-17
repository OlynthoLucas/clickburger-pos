import axios from "axios";
import {
  BarChart3,
  CalendarDays,
  Download,
  FlaskConical,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  fetchSalesReport,
  seedDevReportsOrders,
  type TopProductReportDto,
} from "../../services/reportsApi";
import styles from "./ReportsAdmin.module.scss";

type RangePreset = "today" | "7d" | "30d";

function toISODate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function addDays(base: Date, deltaDays: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + deltaDays);
  return d;
}

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function downloadCSV(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function parseApiMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
    if (typeof err.response?.data === "string") return err.response.data;
  }
  if (err instanceof Error) return err.message;
  return "Não foi possível carregar o relatório.";
}

export default function ReportsAdmin() {
  const today = useMemo(() => new Date(), []);

  const [preset, setPreset] = useState<RangePreset>("7d");
  const [from, setFrom] = useState<string>(() => toISODate(addDays(today, -6)));
  const [to, setTo] = useState<string>(() => toISODate(today));

  const [loading, setLoading] = useState(true);
  const [ordersCount, setOrdersCount] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [averageTicket, setAverageTicket] = useState(0);
  const [topProducts, setTopProducts] = useState<TopProductReportDto[]>([]);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [devSeeding, setDevSeeding] = useState(false);

  const validationError =
    from > to ? "A data inicial não pode ser maior que a final." : null;

  useEffect(() => {
    let active = true;

    async function run() {
      await Promise.resolve();
      if (!active) return;

      if (from > to) {
        setOrdersCount(0);
        setRevenue(0);
        setAverageTicket(0);
        setTopProducts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await fetchSalesReport(from, to);
        if (!active) return;
        setOrdersCount(data.ordersCount);
        setRevenue(Number(data.revenue));
        setAverageTicket(Number(data.averageTicket));
        setTopProducts(data.topProducts ?? []);
      } catch (e) {
        if (!active) return;
        toast.error(parseApiMessage(e));
        setOrdersCount(0);
        setRevenue(0);
        setAverageTicket(0);
        setTopProducts([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    void run();
    return () => {
      active = false;
    };
  }, [from, to, refreshNonce]);

  const handlePreset = (p: RangePreset) => {
    setPreset(p);
    if (p === "today") {
      const t = toISODate(today);
      setFrom(t);
      setTo(t);
      return;
    }
    if (p === "7d") {
      setFrom(toISODate(addDays(today, -6)));
      setTo(toISODate(today));
      return;
    }
    setFrom(toISODate(addDays(today, -29)));
    setTo(toISODate(today));
  };

  const runDevSeedOrders = async () => {
    setDevSeeding(true);
    try {
      const result = await seedDevReportsOrders({
        count: 48,
        daysBack: 40,
      });
      toast.success(result.message);
      handlePreset("30d");
      setRefreshNonce((n) => n + 1);
    } catch (e) {
      toast.error(parseApiMessage(e));
    } finally {
      setDevSeeding(false);
    }
  };

  const exportCSV = () => {
    if (loading || validationError) return;
    const header = ["produto", "quantidade", "receita"].join(",");
    const rows = topProducts.map((p) =>
      [p.name, String(p.quantity), String(p.revenue)].join(",")
    );
    const csv = [header, ...rows].join("\n");
    downloadCSV(`relatorio-top-produtos_${from}_${to}.csv`, csv);
    toast.success("CSV exportado.");
  };

  const kpiClass = loading
    ? `${styles.kpiGrid} ${styles.kpiLoading}`
    : styles.kpiGrid;

  return (
    <div className={styles.container}>
      {validationError && (
        <div className={styles.bannerError} role="alert">
          {validationError}
        </div>
      )}

      {import.meta.env.DEV && (
        <div className={styles.devBanner}>
          <span>
            Modo desenvolvimento: popular pedidos FECHADO fictícios no MongoDB
            (exige API em Development). Ajustamos o filtro para 30 dias após o
            seed.
          </span>
          <button
            type="button"
            className={styles.devSeedBtn}
            onClick={() => void runDevSeedOrders()}
            disabled={devSeeding || loading || !!validationError}
          >
            {devSeeding ? (
              <Loader2 size={18} className={styles.spinner} aria-hidden />
            ) : (
              <FlaskConical size={18} aria-hidden />
            )}
            Popular dados de teste
          </button>
        </div>
      )}

      <div className={styles.toolbar}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>Relatórios</h1>
          <p className={styles.subtitle}>
            Pedidos fechados no período (faturamento e ticket médio reais)
          </p>
        </div>

        <div className={styles.controls}>
          <div className={styles.segment}>
            <button
              type="button"
              onClick={() => handlePreset("today")}
              className={`${styles.segmentBtn} ${
                preset === "today" ? styles.segmentBtnActive : ""
              }`}
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={() => handlePreset("7d")}
              className={`${styles.segmentBtn} ${
                preset === "7d" ? styles.segmentBtnActive : ""
              }`}
            >
              7 dias
            </button>
            <button
              type="button"
              onClick={() => handlePreset("30d")}
              className={`${styles.segmentBtn} ${
                preset === "30d" ? styles.segmentBtnActive : ""
              }`}
            >
              30 dias
            </button>
          </div>

          <div className={styles.dateRow}>
            <CalendarDays
              size={18}
              className={styles.calendarIcon}
              aria-hidden
            />
            <input
              aria-label="Data inicial"
              type="date"
              value={from}
              onChange={(e) => {
                setPreset("7d");
                setFrom(e.target.value);
              }}
            />
            <span className={styles.dash}>—</span>
            <input
              aria-label="Data final"
              type="date"
              value={to}
              onChange={(e) => {
                setPreset("7d");
                setTo(e.target.value);
              }}
            />
            {loading && (
              <Loader2
                size={20}
                className={styles.spinner}
                aria-label="Carregando"
              />
            )}
          </div>

          <button
            type="button"
            onClick={exportCSV}
            className={styles.exportBtn}
            disabled={loading || !!validationError}
          >
            <Download size={18} aria-hidden />
            Exportar CSV
          </button>
        </div>
      </div>

      <div className={kpiClass}>
        <KpiCard
          title="Pedidos fechados"
          value={String(ordersCount)}
          hint={`${from} → ${to}`}
          icon={<BarChart3 size={22} />}
          variant="blue"
        />
        <KpiCard
          title="Faturamento"
          value={formatBRL(revenue)}
          hint="Soma dos totais (FECHADO)"
          icon={<TrendingUp size={22} />}
          variant="emerald"
        />
        <KpiCard
          title="Ticket médio"
          value={formatBRL(averageTicket)}
          hint="Por pedido fechado"
          icon={<BarChart3 size={22} />}
          variant="amber"
        />
      </div>

      <div className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>Top produtos</h2>
          <p>Linhas de pedido agregadas por item do cardápio</p>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Qtd.</th>
                <th>Receita</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.length === 0 ? (
                <tr>
                  <td colSpan={3} className={styles.tableEmpty}>
                    {loading
                      ? "Carregando…"
                      : "Nenhum pedido fechado neste período."}
                  </td>
                </tr>
              ) : (
                (Array.isArray(topProducts) ? topProducts : []).map((p) => {
                  const label = p.name || "(sem nome)";
                  const rowKey = p.menuItemId || label;
                  return (
                    <tr key={rowKey}>
                      <td>
                        <div className={styles.productCell}>
                          <div className={styles.avatar}>
                            {(label[0] ?? "?").toUpperCase()}
                          </div>
                          <div className={styles.productMeta}>
                            <div className={styles.productName} title={label}>
                              {label}
                            </div>
                            <div className={styles.productSub}>
                              Receita / unidade:{" "}
                              {formatBRL(p.revenue / Math.max(1, p.quantity))}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className={styles.qty}>{p.quantity}</td>
                      <td className={styles.revenue}>{formatBRL(p.revenue)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  hint,
  icon,
  variant,
}: {
  title: string;
  value: string;
  hint: string;
  icon: ReactNode;
  variant: "blue" | "emerald" | "amber";
}) {
  const iconClass =
    variant === "blue"
      ? styles.kpiIconBlue
      : variant === "emerald"
      ? styles.kpiIconEmerald
      : styles.kpiIconAmber;

  return (
    <div className={styles.kpiCard}>
      <div className={styles.kpiBody}>
        <p className={styles.kpiLabel}>{title}</p>
        <p className={styles.kpiValue}>{value}</p>
        <p className={styles.kpiHint}>{hint}</p>
      </div>
      <div className={iconClass}>{icon}</div>
    </div>
  );
}
