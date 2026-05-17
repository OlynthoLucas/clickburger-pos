import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
    AlertCircle,
    CheckCircle,
    DollarSign,
    Loader2,
    MoreVertical,
    PackageOpen,
    Pencil,
    Plus,
    Search,
    Trash2,
    X
} from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import styles from "./ProductsAdmin.module.scss";

// ================= TYPES =================
interface ProductData {
    id: string;
    name: string;
    category: string;
    price: number;
    active: boolean;
    description: string;
}

interface MenuItemDto {
    id: string;
    name: string;
    description?: string;
    category: string;
    price: number;
    available: boolean;
}

function menuItemToProduct(item: MenuItemDto): ProductData {
    return {
        id: item.id,
        name: item.name,
        category: item.category,
        price: typeof item.price === "number" ? item.price : Number(item.price),
        active: item.available,
        description: item.description || "",
    };
}

interface ProductFormData {
    name: string;
    category: string;
    price: string;
    active: boolean;
    description: string;
}

const EMPTY_FORM: ProductFormData = {
    name: "",
    category: "Lanches",
    price: "",
    active: true,
    description: "",
};

const CATEGORIES = [
    { value: "Lanches", label: "Lanches" },
    { value: "Bebidas", label: "Bebidas" },
    { value: "Sobremesas", label: "Sobremesas" },
    { value: "Adicionais", label: "Adicionais" },
];

const CATEGORY_STYLE: Record<string, string> = {
    "Lanches": "lanches",
    "Bebidas": "bebidas",
    "Sobremesas": "sobremesas",
    "Adicionais": "adicionais",
};

// ================= INTERFACES DOS MODAIS =================
interface ProductModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editing: ProductData | null;
    formData: ProductFormData;
    setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>;
    formError: string;
    formLoading: boolean;
    onSave: () => Promise<void>;
}

interface DeleteConfirmModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product: ProductData | null;
    loading: boolean;
    onConfirm: () => Promise<void>;
}

// ================= MAIN COMPONENT =================
export default function ProductsAdmin() {
    const [products, setProducts] = useState<ProductData[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");

    const [modalOpen, setModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<ProductData | null>(null);
    const [formData, setFormData] = useState<ProductFormData>(EMPTY_FORM);
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState("");

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<ProductData | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

    // ── FETCH ────────────────────────────────────────────────────────────────

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get<MenuItemDto[]>("/api/menu/admin");
            setProducts(response.data.map(menuItemToProduct));
        } catch {
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Função interna async dentro do effect — padrão correto
    useEffect(() => {
        async function load() {
            await fetchProducts();
        }
        load().catch(console.error);
    }, [fetchProducts]);

    // ── FILTER — useMemo em vez de useEffect+setState ────────────────────────

    const filtered = useMemo(() => {
        let result = products;
        if (categoryFilter !== "all") {
            result = result.filter((p) => p.category === categoryFilter);
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter((p) => p.name.toLowerCase().includes(q));
        }
        return result;
    }, [products, search, categoryFilter]);

    // ── TOAST ────────────────────────────────────────────────────────────────

    const showToast = useCallback((type: "success" | "error", msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    }, []);

    // ── MODAL HANDLERS ───────────────────────────────────────────────────────

    const openCreate = useCallback(() => {
        setEditingProduct(null);
        setFormData(EMPTY_FORM);
        setFormError("");
        setModalOpen(true);
    }, []);

    const openEdit = useCallback((product: ProductData) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            category: product.category,
            price: product.price.toFixed(2),
            active: product.active,
            description: product.description,
        });
        setFormError("");
        setModalOpen(true);
    }, []);

    const openDelete = useCallback((product: ProductData) => {
        setDeleteTarget(product);
        setDeleteModalOpen(true);
    }, []);

    // ── SAVE ─────────────────────────────────────────────────────────────────

    const handleSave = useCallback(async () => {
        if (!formData.name.trim() || !formData.price.trim()) {
            setFormError("Nome e preço são obrigatórios.");
            return;
        }

        const priceNum = parseFloat(formData.price.replace(",", "."));
        if (isNaN(priceNum) || priceNum <= 0) {
            setFormError("Insira um preço válido maior que zero.");
            return;
        }

        setFormLoading(true);
        setFormError("");
        try {
            if (editingProduct) {
                const { data } = await api.patch<MenuItemDto>(
                    `/api/menu/${editingProduct.id}`,
                    {
                        name: formData.name.trim(),
                        category: formData.category,
                        price: priceNum,
                        available: formData.active,
                        description: formData.description.trim(),
                    }
                );
                const updated = menuItemToProduct(data);
                setProducts((prev) =>
                    prev.map((p) => (p.id === editingProduct.id ? updated : p))
                );
                showToast("success", "Produto atualizado com sucesso!");
            } else {
                const { data } = await api.post<MenuItemDto>("/api/menu", {
                    name: formData.name.trim(),
                    description: formData.description.trim(),
                    category: formData.category,
                    price: priceNum,
                    images: [],
                    available: formData.active,
                });
                setProducts((prev) => [menuItemToProduct(data), ...prev]);
                showToast("success", "Produto criado com sucesso!");
            }
            setModalOpen(false);
        } catch {
            setFormError("Erro ao salvar. Tente novamente.");
        } finally {
            setFormLoading(false);
        }
    }, [editingProduct, formData, showToast]);

    // ── DELETE ───────────────────────────────────────────────────────────────

    const handleDelete = useCallback(async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        try {
            await api.delete(`/api/menu/${deleteTarget.id}`);
            setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
            showToast("success", "Produto excluído com sucesso!");
        } catch {
            showToast("error", "Erro ao excluir produto.");
        } finally {
            setDeleteLoading(false);
            setDeleteModalOpen(false);
        }
    }, [deleteTarget, showToast]);

    const activeCount = products.filter((p) => p.active).length;
    const inactiveCount = products.length - activeCount;

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
                    <h1 className={styles.title}>Produtos</h1>
                    <p className={styles.subtitle}>{products.length} produtos cadastrados no sistema</p>
                </div>
                <button onClick={openCreate} className={styles.btnAdd}>
                    <Plus size={20} />
                    Novo Produto
                </button>
            </div>

            {/* STATS */}
            <div className={styles.stats}>
                <StatChip label="Total" value={products.length} type="total" />
                <StatChip label="Ativos" value={activeCount} type="active" />
                <StatChip label="Inativos" value={inactiveCount} type="inactive" />
            </div>

            {/* FILTERS */}
            <div className={styles.filters}>
                <div className={styles.searchBox}>
                    <Search size={18} className={styles.icon} />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar produto..."
                    />
                    {search && (
                        <button onClick={() => setSearch("")} className={styles.clearBtn}>
                            <X size={16} />
                        </button>
                    )}
                </div>

                <div className={styles.roleFilters}>
                    <button
                        onClick={() => setCategoryFilter("all")}
                        className={categoryFilter === "all" ? styles.activeFilter : styles.inactiveFilter}
                    >
                        Todos
                    </button>
                    {CATEGORIES.map((c) => (
                        <button
                            key={c.value}
                            onClick={() => setCategoryFilter(c.value)}
                            className={
                                categoryFilter === c.value
                                    ? styles.activeFilter
                                    : styles.inactiveFilter
                            }
                        >
                            {c.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* CARD LIST */}
            {loading ? (
                <div className={styles.loadingBox}>
                    <Loader2 size={32} className="animate-spin" />
                    <p>Carregando produtos...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className={styles.emptyBox}>
                    <PackageOpen size={40} className={styles.icon} />
                    <p>Nenhum produto encontrado.</p>
                    {(search || categoryFilter !== "all") && (
                        <button onClick={() => { setSearch(""); setCategoryFilter("all"); }}>
                            Limpar filtros
                        </button>
                    )}
                </div>
            ) : (
                <div className={styles.cardsGrid}>
                    {filtered.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            onEdit={() => openEdit(product)}
                            onDelete={() => openDelete(product)}
                        />
                    ))}
                </div>
            )}

            {/* MODALS */}
            <ProductModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                editing={editingProduct}
                formData={formData}
                setFormData={setFormData}
                formError={formError}
                formLoading={formLoading}
                onSave={handleSave}
            />

            <DeleteConfirmModal
                open={deleteModalOpen}
                onOpenChange={setDeleteModalOpen}
                product={deleteTarget}
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

const ProductCard = memo(function ProductCard({
    product,
    onEdit,
    onDelete,
}: {
    product: ProductData;
    onEdit: () => void;
    onDelete: () => void;
}) {
    return (
        <div className={`${styles.productCard} ${!product.active ? styles.inactive : ""}`}>
            <div className={styles.productInfo}>
                <div className={`${styles.avatar} ${product.active ? styles.active : styles.inactive}`}>
                    {product.name[0]?.toUpperCase()}
                </div>
                <div className={styles.details}>
                    <p className={styles.name} title={product.name}>
                        {product.name}
                        {!product.active && (
                            <span className={styles.inactiveText}>(Inativo)</span>
                        )}
                    </p>
                    <p className={styles.price}>
                        {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                        }).format(product.price)}
                    </p>
                    <span
                        className={`${styles.categoryBadge} ${styles[CATEGORY_STYLE[product.category] ?? "default"]
                            }`}
                    >
                        {product.category}
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

function ProductModal({
    open,
    onOpenChange,
    editing,
    formData,
    setFormData,
    formError,
    formLoading,
    onSave,
}: ProductModalProps) {
    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className={styles.overlay} />
                <Dialog.Content className={`${styles.modalContent} ${styles.formModal}`}>

                    <div className={styles.modalHeader}>
                        <div className={styles.titleWrap}>
                            <div className={styles.logo}><span>g</span></div>
                            <Dialog.Title className={styles.title}>
                                {editing ? "Editar Produto" : "Novo Produto"}
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
                            Formulário de produto
                        </Dialog.Description>

                        {formError && (
                            <div className={styles.errorBox}>
                                <AlertCircle size={18} />
                                {formError}
                            </div>
                        )}

                        <div className={styles.formGroup}>
                            <label>Nome do Produto *</label>
                            <input
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData((f) => ({ ...f, name: e.target.value }))
                                }
                                placeholder="Ex: X-Burger Especial"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Descrição</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData((f) => ({ ...f, description: e.target.value }))
                                }
                                placeholder="Ex: Pão brioche, blend de 150g, queijo cheddar..."
                                rows={3}
                                style={{
                                    width: "100%",
                                    padding: "0.75rem 1.25rem",
                                    borderRadius: "1rem",
                                    border: "1px solid #e5e7eb",
                                    outline: "none",
                                    resize: "vertical"
                                }}
                            />
                        </div>

                        <div className={`${styles.formGroup} ${styles.twoCols}`}>
                            <div>
                                <label>Categoria *</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) =>
                                        setFormData((f) => ({ ...f, category: e.target.value }))
                                    }
                                >
                                    {CATEGORIES.map((c) => (
                                        <option key={c.value} value={c.value}>{c.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label>Preço (R$) *</label>
                                <div className={styles.priceInputWrap}>
                                    <div className={styles.priceIcon}>
                                        <DollarSign size={16} />
                                    </div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.price}
                                        onChange={(e) =>
                                            setFormData((f) => ({ ...f, price: e.target.value }))
                                        }
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        </div>

                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={formData.active}
                                onChange={(e) =>
                                    setFormData((f) => ({ ...f, active: e.target.checked }))
                                }
                            />
                            <span>Produto Ativo (Visível no cardápio)</span>
                        </label>

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
    product,
    loading,
    onConfirm,
}: DeleteConfirmModalProps) {
    if (!product) return null;
    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className={styles.overlay} />
                <Dialog.Content className={`${styles.modalContent} ${styles.deleteModal}`}>

                    <Dialog.Title style={{ display: "none" }}>Excluir Produto</Dialog.Title>
                    <Dialog.Description style={{ display: "none" }}>
                        Confirmação de exclusão
                    </Dialog.Description>

                    <div className={styles.iconCircle}>
                        <Trash2 size={32} className={styles.icon} />
                    </div>
                    <h2>Excluir Produto</h2>
                    <p>
                        Tem certeza que deseja excluir o produto <br />
                        <strong>{product.name}</strong>?<br />
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
