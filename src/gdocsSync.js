export const GDOCS_SOURCES = {
  height: {
    id: '1xvFMcEiUEEPW4TQR-v4MKmqFm8333P57WsT8gg6TCdI',
    title: 'Client 226 Height Doc',
    url: 'https://docs.google.com/document/d/1xvFMcEiUEEPW4TQR-v4MKmqFm8333P57WsT8gg6TCdI/edit',
  },
  cognition: {
    id: '1s6E6rzN_Ct0RbpO00E6jFMABitufPkXwxitusd4kI9Y',
    title: 'Client 226 Cognition Doc',
    url: 'https://docs.google.com/document/d/1s6E6rzN_Ct0RbpO00E6jFMABitufPkXwxitusd4kI9Y/edit',
  },
  master: {
    id: '1PdZH745HKlnmhTabCqJ7bhwZy-JB9hGlDmQjyfzPRMA',
    tabId: 't.oisvdsafkysd',
    title: 'Master Dossier (Tab: Client 226)',
    url: 'https://docs.google.com/document/d/1PdZH745HKlnmhTabCqJ7bhwZy-JB9hGlDmQjyfzPRMA/edit?tab=t.oisvdsafkysd',
  },
};

function extractDoseMapFromMarkdown(md = '') {
  const map = new Map();
  if (!md) return map;

  const lines = String(md).split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Match markdown table rows: | **Compound** ... | Dose ... |
    const tableMatch = line.match(/^\|\s*\*\*([^*|]+)\*\*[^|]*\|\s*([^|]+)\|/);
    if (tableMatch) {
      const name = tableMatch[1].trim();
      const doseCell = tableMatch[2].trim();
      const shortDose = doseCell.match(
        /(\d+(?:\.\d+)?(?:\s*(?:to|–|-)\s*\d+(?:\.\d+)?)?\s*(?:mg|mcg|g|IU|mL|mEq)(?:\s*(?:×\s*\d+|2x\/d|3x\/d|daily|EOD))?)/i
      );
      if (name && shortDose) {
        map.set(name.toLowerCase(), shortDose[1].trim());
      }
      continue;
    }

    // Match bullet lines: - **Compound**: 5,000 mg twice daily or - **Compound** 10 mg
    const bulletMatch = line.match(/^[-*]\s+\*\*([^*]+)\*\*[:\s—-]+(.+)$/);
    if (bulletMatch) {
      const name = bulletMatch[1].trim();
      const rest = bulletMatch[2].trim();
      const shortDose = rest.match(
        /(\d+(?:,\d+)?(?:\.\d+)?(?:\s*(?:to|–|-)\s*\d+(?:,\d+)?(?:\.\d+)?)?\s*(?:mg|mcg|g|IU|mL|mEq)(?:\s*(?:×\s*\d+|twice daily|three times daily|2x\/d|3x\/d|EOD))?)/i
      );
      if (name && shortDose) {
        map.set(
          name.toLowerCase(),
          shortDose[1]
            .replace(/twice daily/i, '× 2')
            .replace(/three times daily/i, '× 3')
            .trim()
        );
      }
    }
  }
  return map;
}

export function applyGoogleDocsOverrides(columns, onHandStrip, syncPayload, isHeight) {
  if (!syncPayload?.docs) {
    return { columns, onHandStrip };
  }

  const docEntry = isHeight ? syncPayload.docs.height : syncPayload.docs.cognition;
  const masterEntry = syncPayload.docs.master;
  const combinedMd = `${docEntry?.markdown || ''}\n${masterEntry?.markdown || ''}`;
  const doseMap = extractDoseMapFromMarkdown(combinedMd);

  if (doseMap.size === 0) {
    return { columns, onHandStrip };
  }

  const matchDose = (itemName, fallbackDose) => {
    const lower = String(itemName).toLowerCase();
    for (const [k, v] of doseMap.entries()) {
      if (lower.includes(k) || k.includes(lower.split('(')[0].trim())) {
        return v;
      }
    }
    return fallbackDose;
  };

  const nextColumns = columns.map((col) => ({
    ...col,
    rows: col.rows.map((row) => ({
      ...row,
      dose: matchDose(row.name, row.dose),
    })),
  }));

  const nextStrip = Array.isArray(onHandStrip)
    ? onHandStrip.map((item) => ({
        ...item,
        dose: matchDose(item.name, item.dose),
      }))
    : onHandStrip;

  return { columns: nextColumns, onHandStrip: nextStrip };
}
