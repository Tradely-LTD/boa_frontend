import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';

export const useExport = () => {
  const token = useSelector((s: RootState) => s.auth.token);

  const downloadCsv = async (endpoint: 'applications' | 'centres', filename: string) => {
    const res  = await fetch(`/api/export/${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openPdf = async (endpoint: 'applications' | 'centres') => {
    const res = await fetch(`/api/export/${endpoint}?format=html`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const html = await res.text();
    const win  = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
  };

  return { downloadCsv, openPdf };
};
