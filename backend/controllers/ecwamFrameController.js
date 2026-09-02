import {
  getEcwamFrameStatus,
  startEcwamFrameBuild,
  validateFrameRequest,
} from '../services/ecwamFrameService.js';

function parseRequest(req) {
  const packageDate = String(req.params.packageDate || '').trim();
  const forecastHour = Number(req.params.forecastHour);
  const validation = validateFrameRequest(packageDate, forecastHour);

  if (!validation.valid) {
    return { error: validation.message };
  }

  return { packageDate, forecastHour: validation.forecastHour };
}

function responseStatusForState(state) {
  switch (state) {
    case 'invalid':
      return 400;
    case 'unavailable':
      return 404;
    case 'busy':
      return 429;
    case 'failed':
      return 500;
    case 'building':
      return 202;
    default:
      return 200;
  }
}

export function getEcwamFrame(req, res) {
  const parsed = parseRequest(req);
  if (parsed.error) {
    return res.status(400).json({ success: false, state: 'invalid', message: parsed.error });
  }

  const result = getEcwamFrameStatus(parsed.packageDate, parsed.forecastHour);
  return res.status(responseStatusForState(result.state)).json({
    success: result.state !== 'invalid' && result.state !== 'failed',
    ...result,
  });
}

export function requestEcwamFrame(req, res) {
  const parsed = parseRequest(req);
  if (parsed.error) {
    return res.status(400).json({ success: false, state: 'invalid', message: parsed.error });
  }

  const result = startEcwamFrameBuild(
    parsed.packageDate,
    parsed.forecastHour,
    req.user?._id ?? req.user?.id ?? null
  );

  return res.status(responseStatusForState(result.state)).json({
    success: !['invalid', 'failed'].includes(result.state),
    ...result,
  });
}
