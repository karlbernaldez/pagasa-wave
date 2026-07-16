import { useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  Clock3,
  Eye,
  PackageOpen,
  Waves,
} from 'lucide-react';

import { publishForecastPackage } from '@/api/forecastPackageAPI';
import { publishProject } from '@/api/projectAPI';
import Button from '@/components/ui/Button';
import {
  CH