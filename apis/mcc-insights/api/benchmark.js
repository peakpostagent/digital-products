// api/benchmark.js — Return anonymized benchmark averages for the Pro UI.
// For now this returns the same static reference values embedded in the
// extension; once we have 50+ subscribers sending opt-in aggregates we'll
// compute live averages here.
//
// GET /api/benchmark  ->  { weeklyAverage, meetingsPerWeek, valuablePercent, currency }

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=3600');

  return res.status(200).json({
    weeklyAverage: 1500,
    meetingsPerWeek: 12,
    valuablePercent: 55,
    currency: 'USD',
    source: 'static_reference_v1',
    lastUpdated: '2026-04-14'
  });
};
