import { Monitor, Smartphone, Download } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Tag } from '../components/ui/Tag';
import { SectionHeader } from '../components/ui/SectionHeader';

const files = [
  {
    title: 'Windows',
    icon: <Monitor size={22} />,
    file: '/downloads/Comic Universe.exe',
    note: 'Портативная',
    size: '66 МБ',
    description: 'Скачай и запусти — без установки. Работает сразу.',
  },
  {
    title: 'Android',
    icon: <Smartphone size={22} />,
    file: '/downloads/android/comic-universe.apk',
    note: 'APK',
    size: '16.9 МБ',
    description: 'Скачай APK и установи на телефон.',
  },
];

export default function DownloadPage() {
  return (
    <section className="page">
      <div className="container stack">
        <SectionHeader
          title="Скачать приложение"
          subtitle="Читай комиксы на любом устройстве. Все данные синхронизируются с сайтом."
          align="center"
        />

        <div className="grid-2">
          {files.map((item) => (
            <Card key={item.title}>
              <div className="stack" style={{ gap: '1rem', alignItems: 'center', textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {item.icon}
                  <strong style={{ fontSize: '1.25rem' }}>{item.title}</strong>
                </div>
                <Tag tone="soft">{item.note} · {item.size}</Tag>
                <p style={{ opacity: 0.7, fontSize: '0.9rem', margin: 0 }}>{item.description}</p>
                <a
                  href={item.file}
                  className="btn btn-primary btn-md"
                  download
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Download size={16} />
                  Скачать
                </a>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
