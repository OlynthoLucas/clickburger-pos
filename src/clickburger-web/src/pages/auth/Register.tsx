import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "../../components/Button/Button";
import { Input } from "../../components/Input/Input";
import { registerApi } from "../../services/authApi";
import styles from "./Register.module.css";

const registerSchema = z.object({
  email: z.email("E-mail inválido"),
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  phone: z.string().min(10, "Telefone inválido").optional(), // Opcional por enquanto pois a API pode não suportar
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

type RegisterForm = z.infer<typeof registerSchema>;

export const Register = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      await registerApi({
        username: data.name.trim(),
        email: data.email.trim(),
        password: data.password,
      });
      navigate("/login", { replace: true });
    } catch (error: unknown) {
      let msg = "Erro ao cadastrar. Tente novamente.";
      if (axios.isAxiosError(error)) {
        const dataMsg = error.response?.data as
          | { message?: string }
          | undefined;
        if (dataMsg?.message) msg = dataMsg.message;
      }
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className={styles.header}>
        <div className={styles.welcomeText}>
          <span className={styles.welcomeSubtitle}>Comece a usar o</span>
          <h1 className={styles.welcomeTitle}>Garçom</h1>
        </div>
        <div className={styles.loginAccount}>
          <Link to="/login" className={styles.loginAccountLink}>
            <span>Já tenho</span>
            <br />
            uma conta
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <Input
          label="E-mail"
          placeholder="Digite seu e-mail.."
          type="email"
          {...register("email")}
          error={errors.email?.message}
        />

        <div className={styles.row}>
          <Input
            label="Nome"
            placeholder="Digite seu nome.."
            {...register("name")}
            error={errors.name?.message}
          />

          <Input
            label="Número de celular"
            placeholder="(xx) x xxxx-xxxx"
            {...register("phone")}
            error={errors.phone?.message}
          />
        </div>

        <Input
          label="Senha"
          placeholder="Digite sua senha.."
          type="password"
          {...register("password")}
          error={errors.password?.message}
        />

        {errorMsg && (
          <div
            style={{
              color: "var(--color-error)",
              fontSize: "0.875rem",
              marginTop: "0.5rem",
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
          Cadastrar
        </Button>
      </form>
    </div>
  );
};
