function parseBookmarksJSON(jsonData) {
  const entries = [];
  
  try {
    const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
    const bookmarks = Array.isArray(data) ? data : (data.bookmarks || []);

    for (const item of bookmarks) {
      const url = item.url || item.URL || item.href || '';
      if (!url || url.trim() === '') continue;

      entries.push({
        url: url,
        title: item.title || item.name || url,
        folderPath: item.folder || item.folderPath || item.parent || '/',
        addDate: item.addDate || item.add_date || item.date_added || Date.now(),
        lastVisit: item.lastVisit || item.last_visit || null,
        visitCount: item.visitCount || item.visit_count || 0,
        isBookmarklet: url.startsWith('javascript:')
      });
    }
  } catch (error) {
    throw new Error(`Failed to parse bookmarks JSON: ${error.message}`);
  }

  return entries;
}

function parseBookmarksHTML(htmlContent) {
  const entries = [];
  const folderStack = ['/'];
  
  try {
    const lines = htmlContent.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Detect folder start
      if (line.includes('<DT><H3')) {
        const folderMatch = line.match(/>([^<]+)<\/H3>/);
        if (folderMatch) {
          const folderName = folderMatch[1];
          folderStack.push(folderStack[folderStack.length - 1] + folderName + '/');
        }
      }
      
      // Detect folder end
      if (line.includes('</DL>')) {
        if (folderStack.length > 1) {
          folderStack.pop();
        }
      }
      
      // Detect bookmark
      if (line.includes('<DT><A HREF=')) {
        const hrefMatch = line.match(/HREF="([^"]+)"/);
        const titleMatch = line.match(/>([^<]+)<\/A>/);
        const addDateMatch = line.match(/ADD_DATE="([^"]+)"/);
        
        if (hrefMatch && titleMatch) {
          const url = hrefMatch[1];
          const title = titleMatch[1];
          const addDate = addDateMatch ? parseInt(addDateMatch[1]) : null;
          
          entries.push({
            url: url,
            title: title,
            folderPath: folderStack[folderStack.length - 1],
            addDate: addDate,
            lastVisit: null,
            visitCount: 0,
            isBookmarklet: url.startsWith('javascript:')
          });
        }
      }
    }
  } catch (error) {
    throw new Error(`Failed to parse bookmarks HTML: ${error.message}`);
  }

  return entries;
}

module.exports = { parseBookmarksJSON, parseBookmarksHTML };
