import { describe, expect, it } from 'vitest';

import {
  formatDate,
  getEmbeddedCurrentFeatureSource,
  getOwner,
  getPreviousFeatureSource,
  getPreviousRemarks,
  getProjectId,
  getProjectName,
  getProjectType,
  getReviewer,
  getTimeline,
  getUserLabel,
  mergeProjectState,
} from './projectReviewViewModel';

describe('projectReviewViewModel', () => {
  describe('project display helpers', () => {
    it('gets project name with title and default fallbacks', () => {
      expect(getProjectName({ name: 'Wave Forecast' })).toBe('Wave Forecast');
      expect(getProjectName({ title: 'Fallback Title' })).toBe('Fallback Title');
      expect(getProjectName({})).toBe('Untitled project');
      expect(getProjectName(null)).toBe('Untitled project');
    });

    it('gets project id from _id or id', () => {
      expect(getProjectId({ _id: 'mongo-id', id: 'plain-id' })).toBe('mongo-id');
      expect(getProjectId({ id: 'plain-id' })).toBe('plain-id');
      expect(getProjectId(null)).toBeUndefined();
    });

    it('gets project type with chartType, type, and default fallbacks', () => {
      expect(getProjectType({ chartType: 'Wave' })).toBe('Wave');
      expect(getProjectType({ type: 'Wind' })).toBe('Wind');
      expect(getProjectType({})).toBe('Forecast');
    });

    it('formats dates and returns dash for empty values', () => {
      expect(formatDate('2026-01-15T10:30:00.000Z')).toMatch(/Jan\s+15,\s+2026/);
      expect(formatDate()).toBe('—');
    });
  });

  describe('user display helpers', () => {
    it('gets owner from ownerDisplay, string owner, object full name, email, or default fallback', () => {
      expect(getOwner({ ownerDisplay: 'Display Owner' })).toBe('Display Owner');
      expect(getOwner({ owner: 'owner-id' })).toBe('owner-id');
      expect(getOwner({ owner: { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' } })).toBe('Ada Lovelace');
      expect(getOwner({ owner: { email: 'owner@example.com' } })).toBe('owner@example.com');
      expect(getOwner({ owner: {} })).toBe('Project Owner');
      expect(getOwner({})).toBe('Project Owner');
    });

    it('gets user label from string, full name, username, email, or system fallback', () => {
      expect(getUserLabel('System User')).toBe('System User');
      expect(getUserLabel({ firstName: 'Grace', lastName: 'Hopper', email: 'grace@example.com' })).toBe('Grace Hopper');
      expect(getUserLabel({ username: 'reviewer01', email: 'reviewer@example.com' })).toBe('reviewer01');
      expect(getUserLabel({ email: 'reviewer@example.com' })).toBe('reviewer@example.com');
      expect(getUserLabel({})).toBe('User');
      expect(getUserLabel(null)).toBe('System');
    });

    it('gets reviewer from approvedBy, rejectedBy, reviewStartedBy, or system fallback', () => {
      expect(getReviewer({ approvedBy: { firstName: 'Approved', lastName: 'Admin' } })).toBe('Approved Admin');
      expect(getReviewer({ rejectedBy: { firstName: 'Rejected', lastName: 'Admin' } })).toBe('Rejected Admin');
      expect(getReviewer({ reviewStartedBy: { firstName: 'Started', lastName: 'Admin' } })).toBe('Started Admin');
      expect(getReviewer({})).toBe('System');
    });
  });

  describe('timeline and remarks helpers', () => {
    const project = {
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-05T00:00:00.000Z',
      auditLogs: [
        {
          _id: 'older-log',
          action: 'submitted',
          performedBy: { firstName: 'Older', lastName: 'Admin' },
          comment: 'Older useful comment',
          createdAt: '2026-01-02T00:00:00.000Z',
        },
        {
          _id: 'newer-log',
          action: 'comment_added',
          performedBy: { firstName: 'Newer', lastName: 'Admin' },
          comment: 'Newer useful comment',
          createdAt: '2026-01-04T00:00:00.000Z',
        },
      ],
    };

    it('builds timeline entries and sorts newest first', () => {
      const timeline = getTimeline(project);

      expect(timeline).toHaveLength(2);
      expect(timeline[0]).toMatchObject({
        id: 'newer-log',
        action: 'comment_added',
        actor: 'Newer Admin',
        comment: 'Newer useful comment',
      });
      expect(timeline[1]).toMatchObject({
        id: 'older-log',
        action: 'submitted',
        actor: 'Older Admin',
      });
    });

    it('uses fallback id, action, actor, and dates for sparse audit logs', () => {
      const timeline = getTimeline({
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
        auditLogs: [{}],
      });

      expect(timeline[0]).toMatchObject({
        id: 'undefined-0',
        action: 'updated',
        actor: 'System',
        date: '2026-01-02T00:00:00.000Z',
      });
    });

    it('returns empty timeline when auditLogs is missing', () => {
      expect(getTimeline({})).toEqual([]);
      expect(getTimeline(null)).toEqual([]);
    });

    it('filters system remarks, deduplicates repeated remarks, and sorts newest first', () => {
      const remarks = getPreviousRemarks({
        updatedAt: '2026-01-05T00:00:00.000Z',
        auditLogs: [
          {
            _id: 'system-created',
            action: 'created',
            comment: 'Project created',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
          {
            _id: 'old-useful',
            action: 'comment_added',
            performedBy: 'Reviewer A',
            comment: 'Needs better coastline annotation',
            createdAt: '2026-01-02T00:00:00.000Z',
          },
          {
            _id: 'duplicate-useful',
            action: 'comment_added',
            performedBy: 'Reviewer A',
            comment: 'Needs better coastline annotation',
            createdAt: '2026-01-02T00:00:00.000Z',
          },
          {
            _id: 'new-useful',
            action: 'comment_added',
            performedBy: 'Reviewer B',
            comment: 'Latest review note',
            createdAt: '2026-01-04T00:00:00.000Z',
          },
        ],
      });

      expect(remarks.map((item) => item.comment)).toEqual([
        'Latest review note',
        'Needs better coastline annotation',
      ]);
    });
  });

  describe('feature source helpers', () => {
    it('gets embedded current feature source from features, featureCollection, annotations, or empty fallback', () => {
      const features = [{ id: 'feature' }];
      const featureCollection = { type: 'FeatureCollection', features: [{ id: 'feature-collection' }] };
      const annotations = [{ id: 'annotation' }];

      expect(getEmbeddedCurrentFeatureSource({ features })).toBe(features);
      expect(getEmbeddedCurrentFeatureSource({ featureCollection })).toBe(featureCollection);
      expect(getEmbeddedCurrentFeatureSource({ annotations })).toBe(annotations);
      expect(getEmbeddedCurrentFeatureSource({})).toEqual([]);
    });

    it('gets previous feature source from previous version when multiple versions exist', () => {
      const firstVersion = { features: [{ id: 'first' }] };
      const previousVersion = { featureCollection: { type: 'FeatureCollection', features: [{ id: 'previous' }] } };
      const currentVersion = { features: [{ id: 'current' }] };

      expect(getPreviousFeatureSource({ versions: [firstVersion, previousVersion, currentVersion] })).toBe(previousVersion.featureCollection);
    });

    it('gets previous feature source from only version when one version exists', () => {
      const onlyVersion = { annotations: [{ id: 'annotation' }] };

      expect(getPreviousFeatureSource({ versions: [onlyVersion] })).toBe(onlyVersion.annotations);
    });

    it('returns empty previous feature source when versions are missing', () => {
      expect(getPreviousFeatureSource({})).toEqual([]);
      expect(getPreviousFeatureSource(null)).toEqual([]);
    });
  });

  describe('mergeProjectState', () => {
    it('returns whichever project exists when previous or next project is missing', () => {
      const previousProject = { id: 'previous' };
      const nextProject = { id: 'next' };

      expect(mergeProjectState(previousProject, null)).toBe(previousProject);
      expect(mergeProjectState(null, nextProject)).toBe(nextProject);
    });

    it('merges new project fields while preserving feature-related fields omitted by the API response', () => {
      const previousProject = {
        id: 'project-1',
        name: 'Old Name',
        status: 'under_review',
        features: [{ id: 'feature' }],
        featureCollection: { type: 'FeatureCollection', features: [{ id: 'fc' }] },
        annotations: [{ id: 'annotation' }],
        versions: [{ id: 'version' }],
      };
      const nextProject = {
        id: 'project-1',
        name: 'New Name',
        status: 'approved',
      };

      expect(mergeProjectState(previousProject, nextProject)).toEqual({
        ...previousProject,
        ...nextProject,
        features: previousProject.features,
        featureCollection: previousProject.featureCollection,
        annotations: previousProject.annotations,
        versions: previousProject.versions,
      });
    });

    it('uses next feature-related fields when the API response includes them', () => {
      const previousProject = {
        id: 'project-1',
        features: [{ id: 'old-feature' }],
        featureCollection: { type: 'FeatureCollection', features: [{ id: 'old-fc' }] },
        annotations: [{ id: 'old-annotation' }],
        versions: [{ id: 'old-version' }],
      };
      const nextProject = {
        id: 'project-1',
        features: [{ id: 'new-feature' }],
        featureCollection: { type: 'FeatureCollection', features: [{ id: 'new-fc' }] },
        annotations: [{ id: 'new-annotation' }],
        versions: [{ id: 'new-version' }],
      };

      expect(mergeProjectState(previousProject, nextProject)).toMatchObject(nextProject);
    });
  });
});
