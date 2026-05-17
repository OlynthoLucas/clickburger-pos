import { AlertCircle, Home } from "lucide-react";
import { useLocation } from "wouter";
import styles from "./NotFound.module.scss";

export default function NotFound() {
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconWrapper}>
          <div className={styles.pulseBg} />
          <AlertCircle className={styles.icon} />
        </div>

        <h1 className={styles.title}>404</h1>

        <h2 className={styles.subtitle}>
          Page Not Found
        </h2>

        <p className={styles.text}>
          Sorry, the page you are looking for doesn't exist.
          <br />
          It may have been moved or deleted.
        </p>

        <div className={styles.actions}>
          <button
            onClick={handleGoHome}
            className={styles.homeBtn}
          >
            <Home size={16} />
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}