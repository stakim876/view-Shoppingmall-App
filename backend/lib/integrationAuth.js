export function requireIntegrationKey(req, res, next) {
  const expected = process.env.WMS_INTEGRATION_API_KEY;
  if (!expected) {
    return res.status(503).json({
      success: false,
      message: 'WMS_INTEGRATION_API_KEY가 설정되지 않았습니다.',
    });
  }

  const key = req.headers['x-api-key'] || req.headers['x-wms-api-key'];
  if (!key || key !== expected) {
    return res.status(401).json({ success: false, message: '유효하지 않은 API 키입니다.' });
  }

  next();
}
