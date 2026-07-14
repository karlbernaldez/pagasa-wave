import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, FolderKanban } from 'lucide-react';

import { approveProject, publishProject, rejectProject, startReviewProject } from '@/api/projectAPI';
import { approveForecastPackage, fetchAdminForecastPackages, publishForecastPackage, startForecastPackageReview } from '@/api/forecastPackageAPI';