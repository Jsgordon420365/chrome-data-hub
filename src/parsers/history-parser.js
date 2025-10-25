function parseHistoryJSON(jsonData) {
  const entries = [];
  
  try {
    const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
    const historyItems = Array.isArray(data) ? data : (data['Browser History'] || data.history || []);

    for (const item of historyItems) {
      const url = item.url || item.URL || '';
      if (!url) continue;

      const domain = extractDomain(url);
      
      entries.push({
        id: item.id || item.visitId || generateId(url, item.visitTime),
        url: url,
        title: item.title || item.name || url,
        visitTime: item.visitTime || item.last_visit_time || item.lastVisitTime || Date.now(),
        lastVisitTime: item.lastVisitTime || item.last_visit_time || item.visitTime || Date.now(),
        visitCount: item.visitCount || item.visit_count || 1,
        typedCount: item.typedCount || item.typed_count || 0,
        transition: item.transition || 'link',
        domain: domain,
        isLocal: item.isLocal || false
      });
    }
  } catch (error) {
    throw new Error(`Failed to parse history JSON: ${error.message}`);
  }

  return entries;
}

function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return null;
  }
}

function generateId(url, visitTime) {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

module.exports = { parseHistoryJSON };
