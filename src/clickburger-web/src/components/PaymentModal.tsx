import { useState } from "react";
import { useOrderStore } from "../store/orderStore";
import { closeOrdersInBackend } from "../services/orderApiService";
import styles from "./PaymentModal.module.scss";

type PaymentMethod = "DINHEIRO" | "CARTAO" | "PIX";

interface PaymentModalProps {
    mesaId: number;
    onClose: () => void;
    onFinish: () => void;
}

export function PaymentModal({ mesaId, onClose, onFinish }: PaymentModalProps) {
    const {
        getTableTotal,
        getTablePaid,
        getTableRemaining,
        getOrdersByTable,
        registerPayment,
    } = useOrderStore();

    const total = getTableTotal(mesaId);
    const paid = getTablePaid(mesaId);
    const remaining = getTableRemaining(mesaId);

    const [mode, setMode] = useState<"total" | "parcial">("total");
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("DINHEIRO");
    const [inputValue, setInputValue] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const parsedInput = parseFloat(inputValue.replace(",", ".") || "0");

    async function handlePagar() {
        setError("");
        setLoading(true);

        try {
            if (mode === "total") {
                registerPayment(mesaId, remaining);

                // Fecha todos os pedidos da mesa no backend
                const orders = getOrdersByTable(mesaId);
                await closeOrdersInBackend(mesaId, orders, paymentMethod);

                onFinish();
                return;
            }

            // Modo parcial
            if (!parsedInput || parsedInput <= 0) {
                setError("Informe um valor válido.");
                return;
            }

            if (parsedInput > remaining) {
                setError(`Valor maior que o restante (R$ ${remaining.toFixed(2)}).`);
                return;
            }

            registerPayment(mesaId, parsedInput);

            const newRemaining = remaining - parsedInput;
            if (newRemaining <= 0) {
                // Quitou tudo — fecha no backend
                const orders = getOrdersByTable(mesaId);
                await closeOrdersInBackend(mesaId, orders, paymentMethod);
                onFinish();
            } else {
                onClose();
            }
        } finally {
            setLoading(false);
        }
    }

    const progressPct = total > 0 ? Math.min((paid / total) * 100, 100) : 0;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>

                {/* HEADER */}
                <div className={styles.header}>
                    <h2>💳 Fechar conta</h2>
                    <p>Mesa {String(mesaId).padStart(2, "0")}</p>
                </div>

                {/* RESUMO FINANCEIRO */}
                <div className={styles.summary}>
                    <div className={styles.summaryRow}>
                        <span>Total da mesa</span>
                        <strong>R$ {total.toFixed(2)}</strong>
                    </div>

                    {paid > 0 && (
                        <div className={styles.summaryRow}>
                            <span>Já pago</span>
                            <strong className={styles.paidValue}>R$ {paid.toFixed(2)}</strong>
                        </div>
                    )}

                    <div className={styles.summaryRow}>
                        <span>Restante</span>
                        <strong className={styles.remainingValue}>R$ {remaining.toFixed(2)}</strong>
                    </div>

                    {paid > 0 && (
                        <div className={styles.progressBar}>
                            <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
                        </div>
                    )}
                </div>

                {/* FORMA DE PAGAMENTO */}
                <div className={styles.paymentMethods}>
                    <p className={styles.paymentLabel}>Forma de pagamento</p>
                    <div className={styles.modeSelector}>
                        {(["DINHEIRO", "CARTAO", "PIX"] as PaymentMethod[]).map((m) => (
                            <button
                                key={m}
                                className={`${styles.modeBtn} ${paymentMethod === m ? styles.modeActive : ""}`}
                                onClick={() => setPaymentMethod(m)}
                            >
                                {m === "DINHEIRO" ? "💵 Dinheiro" : m === "CARTAO" ? "💳 Cartão" : "📱 Pix"}
                            </button>
                        ))}
                    </div>
                </div>

                {/* SELEÇÃO DO MODO */}
                <div className={styles.modeSelector}>
                    <button
                        className={`${styles.modeBtn} ${mode === "total" ? styles.modeActive : ""}`}
                        onClick={() => { setMode("total"); setError(""); }}
                    >
                        Pagar total
                    </button>
                    <button
                        className={`${styles.modeBtn} ${mode === "parcial" ? styles.modeActive : ""}`}
                        onClick={() => { setMode("parcial"); setError(""); }}
                    >
                        Pagamento parcial
                    </button>
                </div>

                {/* MODO TOTAL */}
                {mode === "total" && (
                    <div className={styles.modeContent}>
                        <p className={styles.modeDescription}>
                            Confirma o pagamento de <strong>R$ {remaining.toFixed(2)}</strong> e encerra a mesa.
                        </p>
                    </div>
                )}

                {/* MODO PARCIAL */}
                {mode === "parcial" && (
                    <div className={styles.modeContent}>
                        <p className={styles.modeDescription}>
                            Informe o valor que será pago agora. A mesa permanece aberta para os demais pagamentos.
                        </p>

                        <div className={styles.inputGroup}>
                            <span className={styles.currencyPrefix}>R$</span>
                            <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                placeholder="0,00"
                                value={inputValue}
                                onChange={e => { setInputValue(e.target.value); setError(""); }}
                                className={styles.valueInput}
                                autoFocus
                            />
                        </div>

                        <div className={styles.quickValues}>
                            {[
                                { label: "1/4", value: total / 4 },
                                { label: "1/3", value: total / 3 },
                                { label: "1/2", value: total / 2 },
                                { label: "Restante", value: remaining },
                            ]
                                .filter(q => q.value > 0 && q.value <= remaining)
                                .map(q => (
                                    <button
                                        key={q.label}
                                        className={styles.quickBtn}
                                        onClick={() => setInputValue(q.value.toFixed(2))}
                                    >
                                        {q.label}
                                        <small>R$ {q.value.toFixed(2)}</small>
                                    </button>
                                ))}
                        </div>

                        {error && <p className={styles.error}>{error}</p>}
                    </div>
                )}

                {/* AÇÕES */}
                <div className={styles.actions}>
                    <button className={styles.btnCancel} onClick={onClose} disabled={loading}>
                        Cancelar
                    </button>
                    <button
                        className={styles.btnConfirm}
                        onClick={() => { handlePagar().catch(console.error); }}
                        disabled={loading}
                    >
                        {loading
                            ? "Processando..."
                            : mode === "total"
                                ? "Confirmar pagamento"
                                : `Registrar R$ ${parsedInput > 0 ? parsedInput.toFixed(2) : "0,00"}`}
                    </button>
                </div>

            </div>
        </div>
    );
}
