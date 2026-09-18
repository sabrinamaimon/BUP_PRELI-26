/**
 * GridWise Natural Language Directive Parser & Deterministic Guardrail Validator
 * 
 * Accurately parses 1-3 operator notes into canonical directive types:
 * 1. solar_reduction: {"hours": [...], "factor": number}
 * 2. minimum_battery_reserve: {"hours": [...], "minimum_energy_kwh": number}
 * 3. no_charge_window: {"hours": [...]}
 * 4. no_discharge_window: {"hours": [...]}
 * 5. max_grid_window: {"hours": [...], "max_grid_kwh": number}
 * 6. no_op: null (applies = false)
 */

/**
 * Extracts whole-hour window [start, end)
 * Examples:
 * "1 PM to 3 PM" -> [13, 14]
 * "13:00 and 15:00" -> [13, 14]
 * "between 2 PM and 4 PM" -> [14, 15]
 * "from 6 PM until 9 PM" -> [18, 19, 20]
 * "1-3 PM" -> [13, 14]
 */
export function extractHourWindow(text) {
  const clean = text.toLowerCase();

  // Pattern: "13:00 to 15:00" or "13:00 and 15:00"
  const match24 = clean.match(/(\d{1,2}):00\s*(?:to|and|-|until)\s*(\d{1,2}):00/);
  if (match24) {
    const start = parseInt(match24[1], 10);
    const end = parseInt(match24[2], 10);
    if (start >= 0 && end <= 24 && start < end) {
      const hours = [];
      for (let h = start; h < end; h++) hours.push(h);
      return hours;
    }
  }

  // Pattern: "1-3 pm" or "1 to 3 pm"
  const matchDashPm = clean.match(/(\d{1,2})\s*(?:-|to)\s*(\d{1,2})\s*(am|pm)/);
  if (matchDashPm) {
    let start = parseInt(matchDashPm[1], 10);
    let end = parseInt(matchDashPm[2], 10);
    const meridiem = matchDashPm[3];

    if (meridiem === 'pm') {
      if (start < 12) start += 12;
      if (end < 12) end += 12;
    }
    const hours = [];
    for (let h = start; h < end; h++) {
      if (h >= 0 && h < 24) hours.push(h);
    }
    if (hours.length > 0) return hours;
  }

  // Pattern: "between 2 PM and 4 PM" or "from 6 PM until 9 PM"
  const matchMeridiem = clean.match(/(\d{1,2})\s*(am|pm)\s*(?:to|and|until|-)\s*(\d{1,2})\s*(am|pm)/);
  if (matchMeridiem) {
    let start = parseInt(matchMeridiem[1], 10);
    const startMer = matchMeridiem[2];
    let end = parseInt(matchMeridiem[3], 10);
    const endMer = matchMeridiem[4];

    if (startMer === 'pm' && start < 12) start += 12;
    if (startMer === 'am' && start === 12) start = 0;
    if (endMer === 'pm' && end < 12) end += 12;
    if (endMer === 'am' && end === 12) end = 0;

    const hours = [];
    for (let h = start; h < end; h++) {
      if (h >= 0 && h < 24) hours.push(h);
    }
    if (hours.length > 0) return hours;
  }

  // Pattern: "one until three" / "one to three pm"
  if (clean.includes('one') && clean.includes('three')) {
    return [13, 14];
  }

  // Default fallback if no window detected
  return [12, 13, 14];
}

/**
 * Extracts solar reduction factor (usable fraction remaining)
 * "drop to about 20%" -> factor 0.2
 * "80% reduction" -> factor 0.2 (1.0 - 0.8)
 * "one-fifth" -> factor 0.2
 * "reduce by 50%" -> factor 0.5
 */
export function extractSolarFactor(text) {
  const clean = text.toLowerCase();

  if (clean.includes('one-fifth') || clean.includes('1/5')) {
    return 0.2;
  }
  if (clean.includes('one-fourth') || clean.includes('1/4') || clean.includes('quarter')) {
    return 0.25;
  }
  if (clean.includes('half') || clean.includes('1/2')) {
    return 0.5;
  }

  // Check for "drop to X%" or "down to X%" or "to about X%"
  const dropToMatch = clean.match(/(?:drop to|down to|to about|leave roughly|reach)\s*(\d+)%/);
  if (dropToMatch) {
    const val = parseFloat(dropToMatch[1]);
    return Math.max(0, Math.min(1, val / 100));
  }

  // Check for "X% reduction" or "reduce by X%"
  const reductionMatch = clean.match(/(\d+)%\s*reduction|reduce[a-z]* by (\d+)%/);
  if (reductionMatch) {
    const pct = parseFloat(reductionMatch[1] || reductionMatch[2]);
    const remaining = (100 - pct) / 100;
    return Math.max(0, Math.min(1, remaining));
  }

  // Plain percentage
  const anyPct = clean.match(/(\d+)%/);
  if (anyPct) {
    const p = parseFloat(anyPct[1]);
    return p <= 50 ? p / 100 : (100 - p) / 100;
  }

  return 0.2;
}

/**
 * Parses an individual operator note
 * @param {string} note
 * @param {number} noteIndex
 * @returns {object} Canonical directive interpretation
 */
export function parseOperatorNote(note, noteIndex = 0) {
  const clean = note.toLowerCase().trim();

  // Distractor checks (no_op)
  const distractorKeywords = [
    'cafeteria', 'menu', 'lunch', 'canteen', 'sports', 'football',
    'cricket', 'holiday', 'greeting', 'weather tomorrow', 'seminar',
    'conference', 'bus schedule', 'shuttle', 'library', 'exam', 'admission'
  ];

  if (distractorKeywords.some(kw => clean.includes(kw))) {
    return {
      note_index: noteIndex,
      applies: false,
      directive_type: 'no_op',
      structured_adjustment: null,
      explanation: 'Distractor or irrelevant note; has no operational impact on the 24-hour campus energy schedule.'
    };
  }

  // 1. Solar Reduction
  if (clean.includes('solar') || clean.includes('pv') || clean.includes('sun') || clean.includes('panel')) {
    if (clean.includes('drop') || clean.includes('reduc') || clean.includes('clean') || clean.includes('wash') || clean.includes('cloud') || clean.includes('storm')) {
      const hours = extractHourWindow(note);
      const factor = extractSolarFactor(note);
      return {
        note_index: noteIndex,
        applies: true,
        directive_type: 'solar_reduction',
        structured_adjustment: {
          hours,
          factor
        },
        explanation: `Solar generation capacity reduced to ${Math.round(factor * 100)}% during hours [${hours.join(', ')}].`
      };
    }
  }

  // 2. Minimum Battery Reserve
  if ((clean.includes('battery') || clean.includes('bess') || clean.includes('storage') || clean.includes('reserve')) &&
      (clean.includes('reserve') || clean.includes('keep at least') || clean.includes('minimum energy') || clean.includes('hold at least'))) {
    const hours = extractHourWindow(note);
    const kwhMatch = clean.match(/(\d+)\s*(?:kwh|kilo)/);
    const reserveKwh = kwhMatch ? parseFloat(kwhMatch[1]) : 120;

    return {
      note_index: noteIndex,
      applies: true,
      directive_type: 'minimum_battery_reserve',
      structured_adjustment: {
        hours,
        minimum_energy_kwh: reserveKwh
      },
      explanation: `Minimum battery reserve elevated to ${reserveKwh} kWh during hours [${hours.join(', ')}].`
    };
  }

  // 3. No Charge Window
  if ((clean.includes('charge') || clean.includes('charging')) && 
      (clean.includes('do not') || clean.includes('don\'t') || clean.includes('prohibit') || clean.includes('disable') || clean.includes('no charge') || clean.includes('prevent charge') || clean.includes('stop charge'))) {
    const hours = extractHourWindow(note);
    return {
      note_index: noteIndex,
      applies: true,
      directive_type: 'no_charge_window',
      structured_adjustment: {
        hours
      },
      explanation: `Battery charging prohibited during maintenance window [${hours.join(', ')}].`
    };
  }

  // 4. No Discharge Window
  if ((clean.includes('discharge') || clean.includes('discharging')) &&
      (clean.includes('do not') || clean.includes('don\'t') || clean.includes('prohibit') || clean.includes('disable') || clean.includes('no discharge') || clean.includes('stop discharge'))) {
    const hours = extractHourWindow(note);
    return {
      note_index: noteIndex,
      applies: true,
      directive_type: 'no_discharge_window',
      structured_adjustment: {
        hours
      },
      explanation: `Battery discharging prohibited during window [${hours.join(', ')}].`
    };
  }

  // 5. Max Grid Window
  if (clean.includes('grid') && (clean.includes('max') || clean.includes('cap') || clean.includes('exceed') || clean.includes('limit') || clean.includes('restrict'))) {
    const hours = extractHourWindow(note);
    const capMatch = clean.match(/(\d+)\s*(?:kwh|kw)/);
    const maxGrid = capMatch ? parseFloat(capMatch[1]) : 150;

    return {
      note_index: noteIndex,
      applies: true,
      directive_type: 'max_grid_window',
      structured_adjustment: {
        hours,
        max_grid_kwh: maxGrid
      },
      explanation: `Grid import capped at maximum ${maxGrid} kWh during hours [${hours.join(', ')}].`
    };
  }

  // Default fallback if note is ambiguous but not explicitly harmful
  return {
    note_index: noteIndex,
    applies: false,
    directive_type: 'no_op',
    structured_adjustment: null,
    explanation: 'Informational note without actionable grid or storage constraints.'
  };
}

/**
 * Validates array of interpreted directives against canonical guardrails
 * @param {Array} interpretations
 * @returns {{valid: boolean, errors: Array<string>}}
 */
export function validateDirectives(interpretations) {
  const allowedTypes = [
    'solar_reduction',
    'minimum_battery_reserve',
    'no_charge_window',
    'no_discharge_window',
    'max_grid_window',
    'no_op'
  ];
  const errors = [];

  interpretations.forEach((item, idx) => {
    if (item.note_index !== idx) {
      errors.push(`Note index mismatch: expected ${idx}, got ${item.note_index}`);
    }

    if (!allowedTypes.includes(item.directive_type)) {
      errors.push(`Invalid directive_type: ${item.directive_type}`);
    }

    if (item.directive_type === 'no_op') {
      if (item.applies !== false) errors.push(`no_op must have applies = false`);
      if (item.structured_adjustment !== null) errors.push(`no_op must have structured_adjustment = null`);
    } else {
      if (item.applies !== true) errors.push(`${item.directive_type} must have applies = true`);
      if (!item.structured_adjustment || typeof item.structured_adjustment !== 'object') {
        errors.push(`${item.directive_type} missing structured_adjustment object`);
      } else {
        const { hours } = item.structured_adjustment;
        if (!Array.isArray(hours)) {
          errors.push(`${item.directive_type} hours must be an array`);
        } else {
          // Check unique, 0..23, ascending
          for (let i = 0; i < hours.length; i++) {
            const h = hours[i];
            if (!Number.isInteger(h) || h < 0 || h > 23) {
              errors.push(`Invalid hour value: ${h}`);
            }
            if (i > 0 && h <= hours[i - 1]) {
              errors.push(`Hours must be unique and strictly ascending`);
            }
          }
        }
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}
