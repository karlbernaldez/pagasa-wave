import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  PackageCheck,
  ShieldCheck,
  UserRound,
  Waves,
  X,
} from 'lucide-react';

import Button from '@/components/ui/Button';
import {
  CHART_LABELS,
  formatPackageDate,
} from '@/features/projects