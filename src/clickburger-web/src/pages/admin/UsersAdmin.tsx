import { useEffect, useState, useCallback, memo } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import {
    Plus,
    Pencil,
    Trash2,
    Search,
    X,
    Loader2,
    Users,
    AlertCircle,
    CheckCircle,
    MoreVertical
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import styles from "./UsersAdmin.module.scss";

// ================= TYPES =================
interface UserData {
    id: string;
    username: string;
    email: string;
    role: string;
}

interface UserFormData {
    username: string;
    email: string;
    role: string;
    password: string;
}

const EMPTY_FORM: UserFormData = {
    username: "",
    email: "",
    role: "garcom",
    password: "",
};

const ROLES = [
    { value: "admin", label: "Administrador" },
    { value: "garcom", label: "Garçom" },
    { value: "cozinha", label: "Cozinha" },
];

const ROLE_LABEL: Record<string, string> = {
    superadmin: "Superadmin",
    admin: "Admin",
    garcom: "Garçom",
    cozinha: "Cozinha",
};

// ================= MAIN COMPONENT =================
export const UsersAdmin = () => {
    const currentUser = useAuthStore((state) => state.user);
    const [users, setUsers] = useState<UserData[]>([]);
    const [filtered, setFiltered] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserData | null>(null);
    const [formData, setFormData] = useState<UserFormData>(EMPTY_FORM);
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState("");

    // Delete confirm
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<UserData | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Toast
    const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

    // ---- Fetch ----
    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get("/api/users");
            setUsers(response.data);
        } catch (error: any) {
            console.error("Error fetching users:", error);
            showToast("error", "Erro ao buscar usuários: " + (error.response?.data?.message || error.message));
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // ---- Filter ----
    useEffect(() => {
        let result = users;
        if (roleFilter !== "all") result = result.filter((u) => u.role === roleFilter);
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(
                (u) => u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
            );
        }
        setFiltered(result);
    }, [users, search, roleFilter]);

    // ---- Toast helper ----
    const showToast = useCallback((type: "success" | "error", msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    }, []);

    // ---- Open Modal ----
    const openCreate = useCallback(() => {
        setEditingUser(null);
        setFormData(EMPTY_FORM);
        setFormError("");
        setModalOpen(true);
    }, []);

    const openEdit = useCallback((user: UserData) => {
        setEditingUser(user);
        setFormData({ username: user.username, email: user.email, role: user.role, password: "" });
        setFormError("");
        setModalOpen(true);
    }, []);

    const openDelete = useCallback((user: UserData) => {
        setDeleteTarget(user);
        setDeleteModalOpen(true);
    }, []);

    // ---- Save (Create / Update) ----
    const handleSave = useCallback(async () => {
        if (!formData.username.trim() || !formData.email.trim()) {
            setFormError("Nome e e-mail são obrigatórios.");
            return;
        }
        if (!editingUser && !formData.password.trim()) {
            setFormError("Senha é obrigatória para novos usuários.");
            return;
        }

        setFormLoading(true);
        setFormError("");
        try {
            if (editingUser) {
                const payload: Partial<UserFormData> = {
                    username: formData.username,
                    email: formData.email,
                    role: formData.role,
                };
                if (formData.password.trim()) payload.password = formData.password;

                await api.put(`/api/users/${editingUser.id}`, payload);
                
                setUsers((prev) =>
                    prev.map((u) =>
                        u.id === editingUser.id
                            ? { ...u, username: formData.username, email: formData.email, role: formData.role }
                            : u
                    )
                );
                showToast("success", "Usuário atualizado com sucesso!");
                setModalOpen(false);
            } else {
                const res = await api.post("/api/users/staff", formData);
                const newUser = res.data;
                setUsers((prev) => [newUser, ...prev]);
                showToast("success", "Usuário criado com sucesso!");
                setModalOpen(false);
            }
        } catch (error: any) {
            const errorData = error.response?.data;
            let errMsg = "Erro ao salvar. Tente novamente.";
            if (errorData) {
                if (errorData.message) errMsg = errorData.message;
                else if (errorData.errors) {
                    const firstKey = Object.keys(errorData.errors)[0];
                    errMsg = errorData.errors[firstKey][0];
                }
            } else {
                errMsg = error.message;
            }
            setFormError(errMsg);
        } finally {
            setFormLoading(false);
        }
    }, [editingUser, formData, showToast]);

    // ---- Delete ----
    const handleDelete = useCallback(async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        try {
            await api.delete(`/api/users/${deleteTarget.id}`);
            setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
            showToast("success", "Usuário excluído com sucesso!");
            setDeleteModalOpen(false);
        } catch (error: any) {
            showToast("error", error.response?.data?.message || "Erro ao excluir usuário.");
        } finally {
            setDeleteLoading(false);
            setDeleteTarget(null);
        }
    }, [deleteTarget, showToast]);

    const totalAdmin = users.filter((u) => u.role === "admin").length;
    const totalGarcom = users.filter((u) => u.role === "garcom").length;
    const totalCozinha = users.filter((u) => u.role === "cozinha").length;

    return (
        <div className={styles.container}>
            {/* ===== TOAST ===== */}
            {toast && (
                <div className={`${styles.toast} ${styles[toast.type]}`}>
                    {toast.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    <span>{toast.msg}</span>
                </div>
            )}

            {/* ===== HEADER ===== */}
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Usuários</h1>
                    <p className={styles.subtitle}>{users.length} usuários cadastrados no sistema</p>
                </div>
                <button onClick={openCreate} className={styles.btnAdd}>
                    <Plus size={20} />
                    Novo Usuário
                </button>
            </div>

            {/* ===== STATS CHIPS ===== */}
            <div className={styles.stats}>
                <StatChip label="Total" value={users.length} type="total" />
                <StatChip label="Admin" value={totalAdmin} type="admin" />
                <StatChip label="Garçom" value={totalGarcom} type="garcom" />
                <StatChip label="Cozinha" value={totalCozinha} type="cozinha" />
            </div>

            {/* ===== FILTERS ===== */}
            <div className={styles.filters}>
                <div className={styles.searchBox}>
                    <Search size={18} className={styles.icon} />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar usuário..."
                    />
                    {search && (
                        <button onClick={() => setSearch("")} className={styles.clearBtn}>
                            <X size={16} />
                        </button>
                    )}
                </div>

                <div className={styles.roleFilters}>
                    {["all", "admin", "garcom", "cozinha"].map((r) => (
                        <button
                            key={r}
                            onClick={() => setRoleFilter(r)}
                            className={roleFilter === r ? styles.active : styles.inactive}
                        >
                            {r === "all" ? "Todos" : ROLE_LABEL[r]}
                        </button>
                    ))}
                </div>
            </div>

            {/* ===== CARD LIST ===== */}
            {loading ? (
                <div className={styles.loadingBox}>
                    <Loader2 size={32} className="animate-spin" />
                    <p>Carregando usuários...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className={styles.emptyBox}>
                    <Users size={40} className={styles.icon} />
                    <p>Nenhum usuário encontrado.</p>
                    {(search || roleFilter !== "all") && (
                        <button onClick={() => { setSearch(""); setRoleFilter("all"); }}>
                            Limpar filtros
                        </button>
                    )}
                </div>
            ) : (
                <div className={styles.cardsGrid}>
                    {filtered.map((user) => (
                        <UserCard
                            key={user.id}
                            user={user}
                            currentUserRole={currentUser?.role ?? ""}
                            onEdit={() => openEdit(user)}
                            onDelete={() => openDelete(user)}
                        />
                    ))}
                </div>
            )}

            {/* ===== MODALS ===== */}
            <UserModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                editing={editingUser}
                formData={formData}
                setFormData={setFormData}
                formError={formError}
                formLoading={formLoading}
                onSave={handleSave}
            />

            <DeleteConfirmModal
                open={deleteModalOpen}
                onOpenChange={setDeleteModalOpen}
                user={deleteTarget}
                loading={deleteLoading}
                onConfirm={handleDelete}
            />
        </div>
    );
};

// ================= SUB-COMPONENTS =================

function StatChip({ label, value, type }: { label: string; value: number; type: string }) {
    return (
        <div className={`${styles.statChip} ${styles[type]}`}>
            {label}
            <span className={styles.statValue}>
                {value}
            </span>
        </div>
    );
}

// -- User Card --
const UserCard = memo(function UserCard({ user, currentUserRole, onEdit, onDelete }: { user: UserData; currentUserRole: string; onEdit: () => void; onDelete: () => void }) {
    const canDelete = !(user.role === 'superadmin' && currentUserRole !== 'superadmin');

    return (
        <div className={styles.userCard}>
            <div className={styles.userInfo}>
                <div className={styles.avatar}>
                    {user.username[0]?.toUpperCase()}
                </div>
                <div className={styles.details}>
                    <p className={styles.name}>{user.username}</p>
                    <p className={styles.email}>{user.email}</p>
                    <span className={`${styles.roleBadge} ${styles[user.role] || ''}`}>
                        {ROLE_LABEL[user.role] ?? user.role}
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
                        <DropdownMenu.Item onClick={onEdit} className={`${styles.dropdownItem} ${styles.edit}`}>
                            <Pencil size={16} /> Editar
                        </DropdownMenu.Item>
                        {canDelete && (
                            <>
                                <DropdownMenu.Separator className={styles.separator} />
                                <DropdownMenu.Item onClick={onDelete} className={`${styles.dropdownItem} ${styles.delete}`}>
                                    <Trash2 size={16} /> Excluir
                                </DropdownMenu.Item>
                            </>
                        )}
                    </DropdownMenu.Content>
                </DropdownMenu.Portal>
            </DropdownMenu.Root>
        </div>
    );
});

// -- Radix User Modal --
function UserModal({ open, onOpenChange, editing, formData, setFormData, formError, formLoading, onSave }: any) {
    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className={styles.overlay} />
                <Dialog.Content className={`${styles.modalContent} ${styles.formModal}`}>
                    
                    <div className={styles.modalHeader}>
                        <div className={styles.titleWrap}>
                            <div className={styles.logo}>
                                <span>g</span>
                            </div>
                            <Dialog.Title className={styles.title}>
                                {editing ? "Editar Usuário" : "Novo Usuário"}
                            </Dialog.Title>
                        </div>
                        <Dialog.Close asChild>
                            <button className={styles.closeBtn}>
                                <X size={16} color="white" />
                            </button>
                        </Dialog.Close>
                    </div>

                    <div className={styles.modalBody}>
                        <Dialog.Description style={{ display: 'none' }}>Formulário de usuário</Dialog.Description>
                        {formError && (
                            <div className={styles.errorBox}>
                                <AlertCircle size={18} />
                                {formError}
                            </div>
                        )}

                        <div className={styles.formGroup}>
                            <label>Nome de usuário *</label>
                            <input
                                value={formData.username}
                                onChange={(e) => setFormData((f: any) => ({ ...f, username: e.target.value }))}
                                placeholder="Ex: João Silva"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Email *</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData((f: any) => ({ ...f, email: e.target.value }))}
                                placeholder="joao@clickburger.com"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Cargo *</label>
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData((f: any) => ({ ...f, role: e.target.value }))}
                            >
                                {ROLES.map((r) => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Senha {editing && <span>(vazio = não alterar)</span>}</label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData((f: any) => ({ ...f, password: e.target.value }))}
                                placeholder={editing ? "••••••••" : "Mínimo 8 caracteres"}
                            />
                        </div>

                        <div className={styles.actions}>
                            <Dialog.Close asChild>
                                <button className={styles.btnCancel}>Cancelar</button>
                            </Dialog.Close>
                            <button
                                onClick={onSave}
                                disabled={formLoading}
                                className={styles.btnSubmit}
                            >
                                {formLoading ? <Loader2 size={18} className="animate-spin" /> : null}
                                {editing ? "Atualizar" : "Adicionar"}
                            </button>
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

// -- Radix Delete Confirm Modal --
function DeleteConfirmModal({ open, onOpenChange, user, loading, onConfirm }: any) {
    if (!user) return null;
    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className={styles.overlay} />
                <Dialog.Content className={`${styles.modalContent} ${styles.deleteModal}`}>
                    
                    <Dialog.Title style={{ display: 'none' }}>Excluir Usuário</Dialog.Title>
                    <Dialog.Description style={{ display: 'none' }}>Confirmação de exclusão</Dialog.Description>

                    <div className={styles.iconCircle}>
                        <Trash2 size={32} className={styles.icon} />
                    </div>
                    <h2>Excluir Usuário</h2>
                    <p>
                        Tem certeza que deseja excluir o usuário <br/>
                        <strong>{user.username}</strong>?<br/>
                        Esta ação não pode ser desfeita.
                    </p>
                    
                    <div className={styles.actions}>
                        <Dialog.Close asChild>
                            <button className={styles.btnCancel}>Cancelar</button>
                        </Dialog.Close>
                        <button
                            onClick={onConfirm}
                            disabled={loading}
                            className={styles.btnDelete}
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                            Excluir
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
