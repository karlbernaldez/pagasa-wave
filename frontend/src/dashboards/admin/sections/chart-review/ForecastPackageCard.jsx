import { ArrowRight, CalendarDays, CheckCircle2, Clock3, PackageCheck } from 'lucide-react';

import Button from '@/components/ui/Button';
import { formatPackageDate } from '@/features/projects/utils/forecastPackageGrouping';

const REVIEWABLE_PACKAGE_STATUSES = new Set(['Submitted', 'Under Review']);
const PUBLISHABLE_PACKAGE_STATUSES = new Set(['Approved']);
const REQUIRED_CHART_COUNT = 4