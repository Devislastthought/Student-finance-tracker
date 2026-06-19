
export function compileRegex(input, caseSensitive = false) {
  if (!input || input.trim() === '') return null;
  try {
    const flags = caseSensitive ? '' : 'i';
    return new RegExp(input, flags);
  } catch {
    return null;
  }
}



export function highlight(text, re) {
  if (!re) return escapeHtml(text);
  // Split on matches and rebuild with <mark> tags
  const parts  = [];
  let   lastIdx = 0;
  let   match;
  re.lastIndex = 0; // reset for global re safety
  const safeRe = new RegExp(re.source, re.flags.replace('g', '') + 'g');
  while ((match = safeRe.exec(text)) !== null) {
    parts.push(escapeHtml(text.slice(lastIdx, match.index)));
    parts.push(`<mark>${escapeHtml(match[0])}</mark>`);
    lastIdx = safeRe.lastIndex;
    if (match[0].length === 0) safeRe.lastIndex++;
  }
  parts.push(escapeHtml(text.slice(lastIdx)));
  return parts.join('');
}


function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function filterRecords(records, re) {
  if (!re) return records;
  return records.filter(r =>
    re.test(r.description) || re.test(r.category)
  );
}
