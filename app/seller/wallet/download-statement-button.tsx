'use client';

import {useState} from 'react';

export default function DownloadStatementButton({className}: {className: string}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const downloadStatement = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/bill-credits/statement', {cache: 'no-store'});
      const contentType = response.headers.get('content-type') ?? '';

      if (!response.ok || !contentType.includes('application/pdf')) {
        const result = await response.json().catch(() => ({error: 'Could not create the PDF statement.'}));
        throw new Error(result.error || 'Could not create the PDF statement.');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const disposition = response.headers.get('content-disposition') ?? '';
      const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] ?? 'fairshare-statement.pdf';

      link.href = url;
      link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : 'Could not create the PDF statement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button className={className} type="button" onClick={downloadStatement} disabled={loading}>
        {loading ? 'Creating PDF…' : 'Download statement'}
      </button>
      {error && <span className="statement-download-error" role="alert">{error}</span>}
    </>
  );
}
