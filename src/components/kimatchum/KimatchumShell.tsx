import { Music2 } from 'lucide-react';
import styles from './kimatchum.module.css';

export function KimatchumShell({ children, locale }: { children: React.ReactNode; locale: string }) {
  return <div className={styles.shell} data-kimatchum-shell>
    <header className={styles.header}>
      <a href={`/${locale}/kimatchum`} className={styles.brand} aria-label="키맞춤 홈">
        <Music2 aria-hidden="true" size={26}/><span>키맞춤</span>
      </a>
      <span className={styles.tag}>악보와 코드를 차분히 확인하는 공간</span>
      <span className={styles.badge}>본인 계정 시험</span>
    </header>
    {children}
    <footer className={styles.footer}>키맞춤 · 현재는 코드 검수와 코드 전조를 시험하고 있습니다.</footer>
  </div>;
}
