import { Outlet } from 'react-router-dom';
import styles from './AuthLayout.module.scss';

import LogoIcon from '@/assets/images/logo-g.svg';
import burgerImage from '@/assets/images/vecteezy_hamburger.png';

export const AuthLayout = () => {
    return (
        <div className={styles.container}>
            <div className={styles.leftPanel}>
                <img src={LogoIcon} alt="Logo" className={styles.oqLogo} />
            </div>
            <div className={styles.rightPanel}>
                {/* Imagem de fundo enviada */}
                <img
                    src={burgerImage}
                    alt="Hambúrguer delicioso com respingos"
                    className={styles.burgerImage}
                />
            </div>
            <div className={styles.cardWrapper}>
                <Outlet />
            </div>
        </div>
    );
};