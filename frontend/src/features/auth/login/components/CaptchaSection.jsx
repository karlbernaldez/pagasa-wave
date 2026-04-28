import { forwardRef } from 'react';
import CaptchaWidget from '@/components/login/CaptchaWidget.jsx';

const CaptchaSection = forwardRef(function CaptchaSection({ onVerify }, ref) {
  return <CaptchaWidget ref={ref} onVerify={onVerify} />;
});

export default CaptchaSection;