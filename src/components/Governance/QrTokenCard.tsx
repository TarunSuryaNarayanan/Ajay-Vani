import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { QRCodeIcon } from '../Icons';
import { getGovText, formatGovText } from '../../services/governanceTranslations';

/**
 * Paperless enrolment QR token. Lives in the dashboard side panel so the
 * dashboard itself only carries grant/stipend status.
 */
export const QrTokenCard: React.FC = () => {
  const { qrToken, generateQRToken, admitToCourse, selectedLanguage } = useApp();
  const lang = selectedLanguage || 'hi-IN';
  const t = (key: string) => getGovText(lang, key);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [admitStatus, setAdmitStatus] = useState<string | null>(null);

  useEffect(() => {
    if (qrToken?.qrDataUrl && !qrDataUrl) {
      setQrDataUrl(qrToken.qrDataUrl);
      return;
    }

    if (!qrToken) {
      setIsGeneratingQR(true);
      generateQRToken()
        .then((token) => {
          if (token?.qrDataUrl) {
            setQrDataUrl(token.qrDataUrl);
          }
        })
        .finally(() => setIsGeneratingQR(false));
    }
  }, [qrToken]);

  const handleGenerate = async () => {
    setIsGeneratingQR(true);
    const token = await generateQRToken();
    if (token?.qrDataUrl) {
      setQrDataUrl(token.qrDataUrl);
    }
    setIsGeneratingQR(false);
  };

  const handleAdmitToCourse = async () => {
    if (!qrToken) return;
    const result = await admitToCourse(qrToken.tokenId);
    setAdmitStatus(result.message || (result.success ? t('qrAdmitOk') : t('qrAdmitFail')));
  };

  return (
    <div className="card-flat bg-white border-line p-4 space-y-3">
      <div className="flex items-center space-x-2 text-trust text-xs font-semibold uppercase tracking-wider">
        <QRCodeIcon size={16} color="#009378" />
        <span>डिजिटल क्यूआर टोकन (Digital QR Token)</span>
      </div>

      {isGeneratingQR && <p className="text-xs text-ink-muted">{t('qrGenerating')}</p>}

      {qrDataUrl && (
        <div className="flex flex-col items-center space-y-3">
          <img
            src={qrDataUrl}
            alt="डिजिटल क्यूआर टोकन"
            className="w-40 h-40 border border-line rounded bg-white"
          />
          <div className="text-center">
            <span className="text-xs text-ink-muted block">{t('qrTokenId')}</span>
            <span className="text-xs font-mono font-bold text-ink block mt-0.5 break-all">
              {qrToken?.tokenId}
            </span>
          </div>
          <div className="text-center text-xs text-ink-muted">
            <span>{t('qrScanHint')}</span>
          </div>
          {qrToken?.isUsed ? (
            <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded">
              ✅ {formatGovText(lang, 'qrAdmitted', qrToken.beneficiaryName)}
            </div>
          ) : (
            <button onClick={handleAdmitToCourse} className="btn-primary w-full text-xs">
              {t('qrAdmit')}
            </button>
          )}
          {admitStatus && (
            <p className={`text-xs ${admitStatus.includes('सफल') || admitStatus.includes('successful') || admitStatus.includes('విజయ') || admitStatus.includes('வெற்றி') ? 'text-emerald-700' : 'text-alert'}`}>
              {admitStatus}
            </p>
          )}
        </div>
      )}

      {!qrDataUrl && !isGeneratingQR && (
        <button onClick={handleGenerate} className="btn-secondary w-full space-x-2 text-xs">
          <QRCodeIcon size={16} color="#009378" />
          <span>{t('qrGenerate')}</span>
        </button>
      )}
    </div>
  );
};
