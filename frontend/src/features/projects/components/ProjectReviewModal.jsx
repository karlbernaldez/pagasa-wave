import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

import ReviewActionsFooter from '@/features/projects/components/review/ReviewActionsFooter';
import ReviewMapWorkspace from '@/features/projects/components