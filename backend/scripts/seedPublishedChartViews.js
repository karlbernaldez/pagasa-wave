import crypto from 'node:crypto';

import dotenv from 'dotenv';
import mongoose from 'mongoose';

import Project from '../models/Project.js';
import PublishedChartView from '../models/PublishedChartView.js';

dotenv.config();

const TIME_ZONE = 'Asia/Manila';
const DEFAULT_TODAY_VIEWS = 6;
const DEFAULT_YESTERDAY_VIEWS = 4;

const parseCountArg = (name, fallback) => {
  const prefix = `--${name}=`;
  const value = process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
  if (value === undefined) return fallback;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0 || number > 1000) {
    throw new Error(`${name} must be an integer between 0 and 1000.`);
  }
  return number;
};

const formatManilaDateKey = (date) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
};

const shiftDateKey = (dateKey, days) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const viewedAtForDateKey = (dateKey, index) => {
  const hour = 9 + (index % 10);
  const minute = (index * 7) % 60;
  return new Date(
    `${dateKey}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+08:00`
  );
};

const seedViewerHash = ({ projectId, dateKey, index }) =>
  crypto
    .createHash('sha256')
    .update(`wavelab-dev-chart-view:${projectId}:${dateKey}:${index}`)
    .digest('hex');

const seedDate = async ({ projectId, dateKey, count }) => {
  if (count === 0) return 0;

  const operations = Array.from({ length: count }, (_, index) => {
    const viewerHash = seedViewerHash({ projectId, dateKey, index });
    return {
      updateOne: {
        filter: { project: projectId, dateKey, viewerHash },
        update: {
          $setOnInsert: {
            project: projectId,
            dateKey,
            viewerHash,
            viewedAt: viewedAtForDateKey(dateKey, index),
          },
        },
        upsert: true,
      },
    };
  });

  const result = await PublishedChartView.bulkWrite(operations, { ordered: false });
  return Number(result.upsertedCount) || 0;
};

const run = async () => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed published chart views in production.');
  }
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required.');
  }

  const todayViews = parseCountArg('today', DEFAULT_TODAY_VIEWS);
  const yesterdayViews = parseCountArg('yesterday', DEFAULT_YESTERDAY_VIEWS);

  await mongoose.connect(process.env.MONGO_URI);

  const project = await Project.findOne({ status: 'Published' })
    .sort({ publishedAt: -1, forecastDate: -1, _id: -1 })
    .select('_id name forecastDate status')
    .lean();

  if (!project) {
    throw new Error('No currently Published chart exists to attach test views to.');
  }

  const todayKey = formatManilaDateKey(new Date());
  const yesterdayKey = shiftDateKey(todayKey, -1);

  const [insertedYesterday, insertedToday] = await Promise.all([
    seedDate({ projectId: project._id, dateKey: yesterdayKey, count: yesterdayViews }),
    seedDate({ projectId: project._id, dateKey: todayKey, count: todayViews }),
  ]);

  const [actualYesterday, actualToday, allTime] = await Promise.all([
    PublishedChartView.countDocuments({ dateKey: yesterdayKey }),
    PublishedChartView.countDocuments({ dateKey: todayKey }),
    PublishedChartView.countDocuments({}),
  ]);

  console.log(`Seed chart: ${project.name} (${project._id})`);
  console.log(
    `Yesterday ${yesterdayKey}: +${insertedYesterday} seeded, ${actualYesterday} total views`
  );
  console.log(`Today ${todayKey}: +${insertedToday} seeded, ${actualToday} total views`);
  console.log(`All-time published chart views: ${allTime}`);
  console.log('Refresh Dashboard Overview to see the KPI and day-over-day comparison.');
};

try {
  await run();
} finally {
  await mongoose.disconnect();
}
