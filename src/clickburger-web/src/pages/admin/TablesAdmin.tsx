import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
    AlertCircle,
    CheckCircle,
    ChefHat,
    Loader2,
    MoreVertical,
    Pencil,
    Plus,
    Search,
    Trash2,
    X,
    Users
} from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import styles from "./TablesAdmin.module.scss";

// ================= TYPES =================
interface TableData {
    id: string;
    number: number;
    capacity: number;
    status: string;
    currentOrderId?: string;
}

interface TableFormData {
    number: string;
    capacity: string;
    status: string;
}

const EMPTY_FORM: TableFormData = {
    number: "",
    capacity: "4",
    status: "LIVRE",
};

const STATUS_LIST = [
    { value: "LIVRE", label: "Livre" },
    { value: "OCUPADA", label: "Ocupada" },
];

const STATUS_STYLE: Record<string, string> = {
    "LIVRE": "bebidas", // Reusing green style from products (or similar)
    "OCUPADA": "lanches", // Reusing red style
};

// ================= INTERFACES DOS MODAIS =================
interface TableModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editing: TableData | null;
    formData: TableFormData;
    setFormData: React.Dispatch<React.SetStateAction<TableFormData>>;
    formError: string;
    formLoading: boolean;
    onSave: () => Promise<void>;
}

interface DeleteConfirmModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    table: TableData | null;
    loading: boolean;
    onConfirm: () => Promise<void>;
}

// ================= MAIN COMPONENT =================
export default function TablesAdmin() {
    const [tables, setTables] = useState<TableData[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const [modalOpen, setModalOpen] = useState(false);
    const [editingTable, setEditingTable] = useState<TableData | null>(null);
    const [formData, setFormData] = useState<TableFormData>(EMPTY_FORM);
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState("");

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<TableData | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

    // ── FETCH ────────────────────────────────────────────────────────────────

    const fetchTables = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get<TableData[]>("/api/tables");
            setTables(response.data);
        } catch {
            setTables([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        async function load() {
            await fetchTables();
        }
        load().catch(console.error);
    }, [fetchTables]);

    // ── FILTER ───────────────────────────────────────────────────────────────

    const filtered = useMemo(() => {
        let result = tables;
        if (statusFilter !== "all") {
            result = result.filter((t) => t.status === statusFilter);
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter((t) => String(t.number).includes(q));
        }
        return result;
    }, [tables, search, statusFilter]);

    // ── TOAST ────────────────────────────────────────────────────────────────

    const showToast = useCallback((type: "success" | "error", msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    }, []);

    // ── MODAL HANDLERS ───────────────────────────────────────────────────────

    const openCreate = useCallback(() => {
        setEditingTable(null);
        setFormData(EMPTY_FORM);
        setFormError("");
        setModalOpen(true);
    }, []);

    const openEdit = useCallback((table: TableData) => {
        setEditingTable(table);
        setFormData({
            number: String(table.number),
            capacity: String(table.capacity),
            status: table.status,
        });
        setFormError("");
        setModalOpen(true);
    }, []);

    const openDelete = useCallback((table: TableData) => {
        setDeleteTarget(table);
        setDeleteModalOpen(true);
    }, []);

    // ── SAVE ─────────────────────────────────────────────────────────────────

    const handleSave = useCallback(async () => {
        if (!formData.number.trim() || !formData.capacity.trim()) {
            setFormError("Número e capacidade são obrigatórios.");
            return;
        }

        const numberNum = parseInt(formData.number, 10);
        const capacityNum = parseInt(formData.capacity, 10);

        if (isNaN(numberNum) || numberNum <= 0) {
            setFormError("Insira um número de mesa válido.");
            return;
        }

        if (isNaN(capacityNum) || capacityNum <= 0) {
            setFormError("Insira uma capacidade válida.");
            return;
        }

        setFormLoading(true);
        setFormError("");
        try {
            if (editingTable) {
                const { data } = await api.patch<TableData>(
                    `/api/tables/${editingTable.id}`,
                    {
                        capacity: capacityNum,
                        status: formData.status,
                    }
                );
                setTables((prev) =>
                    prev.map((t) => (t.id === editingTable.id ? data : t))
                );
                showToast("success", "Mesa atualizada com sucesso!");
            } else {
                const { data } = await api.post<TableData>("/api/tables", {
                    number: numberNum,
                    capacity: capacityNum,
                    status: formData.status,
                });
                setTables((prev) => [...prev, data].sort((a, b) => a.number - b.number));
                showToast("success", "Mesa criada com sucesso!");
            }
            setModalOpen(false);
        } catch (err: any) {
            const msg = err.response?.data?.message || "Erro ao salvar. Tente novamente.";
            setFormError(msg);
        } finally {
            setFormLoading(false);
        }
    }, [editingTable, formData, showToast]);

    // ── DELETE ───────────────────────────────────────────────────────────────

    const handleDelete = useCallback(async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        try {
            await api.delete(`/api/tables/${deleteTarget.id}`);
            setTables((prev) => prev.filter((t) => t.id !== deleteTarget.id));
            showToast("success", "Mesa excluída com sucesso!");
        } catch (err: any) {
            const msg = err.response?.data?.message || "Erro ao excluir mesa.";
            showToast("error", msg);
        } finally {
            setDeleteLoading(false);
            setDeleteModalOpen(false);
        }
    }, [deleteTarget, showToast]);

    const freeCount = tables.filter((t) => t.status === "LIVRE").length;
    const occupiedCount = tables.length - freeCount;

    return (
        <div className={styles.container}>

            {/* TOAST */}
            {toast && (
                <div className={`${styles.toast} ${styles[toast.type]}`}>
                    {toast.type === "success"
                        ? <CheckCircle size={18} />
                        : <AlertCircle size={18} />}
                    <span>{toast.msg}</span>
                </div>
            )}

            {/* HEADER */}
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Mesas</h1>
                    <p className={styles.subtitle}>{tables.length} mesas cadastradas no sistema</p>
                </div>
                <button onClick={openCreate} className={styles.btnAdd}>
                    <Plus size={20} />
                    Nova Mesa
                </button>
            </div>

            {/* STATS */}
            <div className={styles.stats}>
                <StatChip label="Total" value={tables.length} type="total" />
                <StatChip label="Livres" value={freeCount} type="active" />
                <StatChip label="Ocupadas" value={occupiedCount} type="inactive" />
            </div>

            {/* FILTERS */}
            <div className={styles.filters}>
                <div className={styles.searchBox}>
                    <Search size={18} className={styles.icon} />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar mesa por número..."
                    />
                    {search && (
                        <button onClick={() => setSearch("")} className={styles.clearBtn}>
                            <X size={16} />
                        </button>
                    )}
                </div>

                <div className={styles.roleFilters}>
                    <button
                        onClick={() => setStatusFilter("all")}
                        className={statusFilter === "all" ? styles.activeFilter : styles.inactiveFilter}
                    >
                        Todas
                    </button>
                    {STATUS_LIST.map((s) => (
                        <button
                            key={s.value}
                            onClick={() => setStatusFilter(s.value)}
                            className={
                                statusFilter === s.value
                                    ? styles.activeFilter
                                    : styles.inactiveFilter
                            }
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* CARD LIST */}
            {loading ? (
                <div className={styles.loadingBox}>
                    <Loader2 size={32} className="animate-spin" />
                    <p>Carregando mesas...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className={styles.emptyBox}>
                    <ChefHat size={40} className={styles.icon} />
                    <p>Nenhuma mesa encontrada.</p>
                    {(search || statusFilter !== "all") && (
                        <button onClick={() => { setSearch(""); setStatusFilter("all"); }}>
                            Limpar filtros
                        </button>
                    )}
                </div>
            ) : (
                <div className={styles.cardsGrid}>
                    {filtered.map((table) => (
                        <TableCard
                            key={table.id}
                            table={table}
                            onEdit={() => openEdit(table)}
                            onDelete={() => openDelete(table)}
                        />
                    ))}
                </div>
            )}

            {/* MODALS */}
            <TableModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                editing={editingTable}
                formData={formData}
                setFormData={setFormData}
                formError={formError}
                formLoading={formLoading}
                onSave={handleSave}
            />

            <DeleteConfirmModal
                open={deleteModalOpen}
                onOpenChange={setDeleteModalOpen}
                table={deleteTarget}
                loading={deleteLoading}
                onConfirm={handleDelete}
            />
        </div>
    );
}

// ================= SUB-COMPONENTS =================

function StatChip({ label, value, type }: { label: string; value: number; type: string }) {
    return (
        <div className={`${styles.statChip} ${styles[type]}`}>
            {label}
            <span className={styles.statValue}>{value}</span>
        </div>
    );
}

const TableCard = memo(function TableCard({
    table,
    onEdit,
    onDelete,
}: {
    table: TableData;
    onEdit: () => void;
    onDelete: () => void;
}) {
    return (
        <div className={`${styles.productCard} ${table.status === "OCUPADA" ? styles.inactive : ""}`}>
            <div className={styles.productInfo}>
                <div className={`${styles.avatar} ${table.status === "LIVRE" ? styles.active : styles.inactive}`}>
                    {table.number}
                </div>
                <div className={styles.details}>
                    <p className={styles.name} title={`Mesa ${table.number}`}>
                        Mesa {table.number}
                    </p>
                    <p className={styles.price} style={{ fontSize: '0.875rem', fontWeight: 500, color: '#6b7280' }}>
                        <Users size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                        Capacidade: {table.capacity} lugares
                    </p>
                    <span
                        className={`${styles.categoryBadge} ${styles[STATUS_STYLE[table.status] ?? "default"]}`}
                    >
                        {table.status}
                    </span>
                </div>
            </div>

            <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                    <button className={styles.menuTrigger}>
                        <MoreVertical size={20} />
                    </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                    <DropdownMenu.Content
                        align="end"
                        sideOffset={5}
                        className={styles.dropdownMenu}
                    >
                        <DropdownMenu.Item
                            onSelect={() => setTimeout(onEdit, 0)}
                            className={`${styles.dropdownItem} ${styles.edit}`}
                        >
                            <Pencil size={16} /> Editar
                        </DropdownMenu.Item>
                        <DropdownMenu.Separator className={styles.separator} />
                        <DropdownMenu.Item
                            onSelect={() => setTimeout(onDelete, 0)}
                            className={`${styles.dropdownItem} ${styles.delete}`}
                        >
                            <Trash2 size={16} /> Excluir
                        </DropdownMenu.Item>
                    </DropdownMenu.Content>
                </DropdownMenu.Portal>
            </DropdownMenu.Root>
        </div>
    );
});

function TableModal({
    open,
    onOpenChange,
    editing,
    formData,
    setFormData,
    formError,
    formLoading,
    onSave,
}: TableModalProps) {
    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className={styles.overlay} />
                <Dialog.Content className={`${styles.modalContent} ${styles.formModal}`}>

                    <div className={styles.modalHeader}>
                        <div className={styles.titleWrap}>
                            <div className={styles.logo}><span>g</span></div>
                            <Dialog.Title className={styles.title}>
                                {editing ? "Editar Mesa" : "Nova Mesa"}
                            </Dialog.Title>
                        </div>
                        <Dialog.Close asChild>
                            <button className={styles.closeBtn}>
                                <X size={16} color="white" />
                            </button>
                        </Dialog.Close>
                    </div>

                    <div className={styles.modalBody}>
                        <Dialog.Description style={{ display: "none" }}>
                            Formulário de mesa
                        </Dialog.Description>

                        {formError && (
                            <div className={styles.errorBox}>
                                <AlertCircle size={18} />
                                {formError}
                            </div>
                        )}

                        <div className={styles.formGroup}>
                            <label>Número da Mesa *</label>
                            <input
                                type="number"
                                min="1"
                                value={formData.number}
                                onChange={(e) =>
                                    setFormData((f) => ({ ...f, number: e.target.value }))
                                }
                                placeholder="Ex: 12"
                                disabled={!!editing}
                            />
                        </div>

                        <div className={`${styles.formGroup} ${styles.twoCols}`}>
                            <div>
                                <label>Capacidade *</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.capacity}
                                    onChange={(e) =>
                                        setFormData((f) => ({ ...f, capacity: e.target.value }))
                                    }
                                    placeholder="Ex: 4"
                                />
                            </div>

                            <div>
                                <label>Status *</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) =>
                                        setFormData((f) => ({ ...f, status: e.target.value }))
                                    }
                                >
                                    {STATUS_LIST.map((c) => (
                                        <option key={c.value} value={c.value}>{c.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className={styles.actions}>
                            <Dialog.Close asChild>
                                <button className={styles.btnCancel}>Cancelar</button>
                            </Dialog.Close>
                            <button
                                onClick={() => { onSave().catch(console.error); }}
                                disabled={formLoading}
                                className={styles.btnSubmit}
                            >
                                {formLoading
                                    ? <Loader2 size={18} className="animate-spin" />
                                    : null}
                                {editing ? "Atualizar" : "Adicionar"}
                            </button>
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

function DeleteConfirmModal({
    open,
    onOpenChange,
    table,
    loading,
    onConfirm,
}: DeleteConfirmModalProps) {
    if (!table) return null;
    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className={styles.overlay} />
                <Dialog.Content className={`${styles.modalContent} ${styles.deleteModal}`}>

                    <Dialog.Title style={{ display: "none" }}>Excluir Mesa</Dialog.Title>
                    <Dialog.Description style={{ display: "none" }}>
                        Confirmação de exclusão
                    </Dialog.Description>

                    <div className={styles.iconCircle}>
                        <Trash2 size={32} className={styles.icon} />
                    </div>
                    <h2>Excluir Mesa</h2>
                    <p>
                        Tem certeza que deseja excluir a <strong>Mesa {table.number}</strong>?<br />
                        Esta ação não pode ser desfeita.
                    </p>

                    <div className={styles.actions}>
                        <Dialog.Close asChild>
                            <button className={styles.btnCancel}>Cancelar</button>
                        </Dialog.Close>
                        <button
                            onClick={() => { onConfirm().catch(console.error); }}
                            disabled={loading}
                            className={styles.btnDelete}
                        >
                            {loading
                                ? <Loader2 size={18} className="animate-spin" />
                                : null}
                            Excluir
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
