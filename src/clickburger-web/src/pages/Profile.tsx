import { ArrowLeft, Mail, Shield, User as UserIcon, LogOut, KeyRound, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import type { ApiUserDto } from "../services/authApi";
import type { User } from "../store/authStore";
import { useAuthStore } from "../store/authStore";
import style from "./Profile.module.scss";

interface InfoCardProps {
    icon: React.ReactNode;
    title: string;
    value: string | number | undefined;
}

export const Profile = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();

    const [profileData, setProfileData] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data } = await api.get<ApiUserDto>("/api/users/me");
                setProfileData({
                    id: data.id,
                    username: data.username,
                    email: data.email,
                    role: data.role,
                });
            } catch {
                setProfileData(user);
            } finally {
                setLoading(false);
            }
        };

        void fetchProfile();
    }, [user]);

    const handleBack = () => {
        const role = profileData?.role ?? user?.role;
        if (role === "cozinha") navigate("/kitchen");
        else if (role === "admin" || role === "superadmin") navigate("/admin");
        else navigate("/waiter");
    };

    if (loading) {
        return (
            <div className={style.loadingContainer}>
                <div className={style.loadingCard}>
                    <div className={style.loadingSpinner} />
                    <p>Carregando perfil...</p>
                </div>
            </div>
        );
    }

    if (!profileData) {
        return (
            <div className={style.loadingContainer}>
                <div className={style.loadingCard}>
                    <p>Nenhum dado encontrado.</p>
                    <button onClick={handleBack} className={style.backBtnAlt}>
                        Voltar
                    </button>
                </div>
            </div>
        );
    }

    const initials = profileData.username?.slice(0, 2).toUpperCase() || "??";

    const roleLabels: Record<string, string> = {
        superadmin: "Super Admin",
        admin: "Administrador",
        garcom: "Garçom",
        cozinha: "Cozinha",
        user: "Usuário",
    };

    return (
        <div className={style.container}>
            <div className={style.contentWrapper}>

                {/* ── HEADER ── */}
                <header className={style.headerCard}>
                    <div className={style.userGroup}>
                        <button onClick={handleBack} className={style.backBtn} title="Voltar">
                            <ArrowLeft size={18} />
                        </button>

                        <div className={style.avatar}>
                            {initials}
                        </div>

                        <div className={style.userInfo}>
                            <h1>{profileData.username}</h1>
                            <span className={style.roleBadge}>
                                {roleLabels[profileData.role] ?? profileData.role}
                            </span>
                        </div>
                    </div>

                    <button onClick={logout} className={style.logoutBtn}>
                        <LogOut size={16} />
                        <span>Sair</span>
                    </button>
                </header>

                {/* ── INFO GRID ── */}
                <div className={style.infoGrid}>
                    <InfoCard
                        icon={<Mail size={18} />}
                        title="E-mail"
                        value={profileData.email}
                    />
                    <InfoCard
                        icon={<UserIcon size={18} />}
                        title="ID do usuário"
                        value={profileData.id}
                    />
                    <InfoCard
                        icon={<Shield size={18} />}
                        title="Nível de acesso"
                        value={roleLabels[profileData.role] ?? profileData.role}
                    />
                </div>

                {/* ── CONFIGURAÇÕES ── */}
                <section className={style.settingsCard}>
                    <h2>Configurações da conta</h2>
                    <div className={style.actionButtons}>
                        <button className={style.actionBtn}>
                            <KeyRound size={15} />
                            Alterar senha
                        </button>
                        <button className={style.actionBtn}>
                            <Pencil size={15} />
                            Editar perfil
                        </button>
                    </div>
                </section>

            </div>
        </div>
    );
};

function InfoCard({ icon, title, value }: InfoCardProps) {
    return (
        <div className={style.infoCard}>
            <div className={style.iconBox}>{icon}</div>
            <div className={style.details}>
                <span className={style.label}>{title}</span>
                <p className={style.value}>{value ?? "—"}</p>
            </div>
        </div>
    );
}
