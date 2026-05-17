import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "../../components/Button/Button";
import { Input } from "../../components/Input/Input";
import { defaultRouteForRole } from "../../lib/authRouting";
import { loginApi } from "../../services/authApi";
import { useAuthStore } from "../../store/authStore";
import styles from "./Login.module.css";

const loginSchema = z.object({
  /** API aceita e-mail ou nome de usuário no campo `username`. */
  email: z.string().min(1, "Informe e-mail ou usuário").max(200),
  password: z.string().min(1, "A senha é obrigatória"),
});

type LoginForm = z.infer<typeof loginSchema>;

export const Login = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const { user, token, refreshToken } = await loginApi({
        username: data.email.trim(),
        password: data.password,
      });
      setAuth(user, token, refreshToken);
      navigate(defaultRouteForRole(user.role), { replace: true });
    } catch (error: unknown) {
      const msg =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : undefined;
      setErrorMsg(
        msg ??
          (error instanceof Error
            ? error.message
            : "Credenciais inválidas. Tente novamente.")
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className={styles.header}>
        <div className={styles.welcomeText}>
          <span className={styles.welcomeSubtitle}>Seja bem-vindo ao</span>
          <h1 className={styles.welcomeTitle}>Garçom</h1>
        </div>
        <div className={styles.createAccount}>
          <span>Criar</span>
          <Link to="/register" className={styles.createAccountLink}>
            Nova conta
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <Input
          label="E-mail ou usuário"
          placeholder="Digite seu e-mail ou usuário.."
          type="text"
          autoComplete="username"
          {...register("email")}
          error={errors.email?.message}
        />

        <Input
          label="Senha"
          placeholder="Digite sua senha.."
          type="password"
          {...register("password")}
          error={errors.password?.message}
        />

        <Link to="/forgot-password" className={styles.forgotPassword}>
          Esqueceu a senha?
        </Link>

        {errorMsg && (
          <div
            style={{
              color: "var(--color-error)",
              fontSize: "0.875rem",
              marginBottom: "1rem",
              textAlign: "center",
            }}
          >
            {errorMsg}
          </div>
        )}

        <Button
          type="submit"
          isLoading={isLoading}
          className={styles.submitButton}
        >
          Entrar
        </Button>
      </form>
    </div>
  );
};
