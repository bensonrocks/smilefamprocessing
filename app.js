const sampleOrders = `Date,Order reference,Name,Phone,Address,Item,Qty,Waybill Reference
2026-05-15 01:13:08,#16192,Lorraine Soh,6585225938,"Blk 303A Punggol Central #10-780
Singapore 821303",Whitening Electric Toothbrush Bundle - Free Whitening Toothpaste + Free Premium Travel Case + 1 Year Warranty (Worth $168),1,SF5136150478642
2026-05-15 01:13:08,#16192,Lorraine Soh,6585225938,"Blk 303A Punggol Central #10-780
Singapore 821303",SmileFam Refiller Pack (Contains 2 Refillers),1,SF5136150478642
2026-05-15 06:04:26,#16200,Jillian Jokom,6581827587,"21 Peck Hay Road
07-01
Singapore 228314",BLU Whitening Toothpaste - One Tube,1,
2026-05-15 06:54:33,#16201,Alice Chin,6597960899,"5a Mariam Close
Singapore 508681",Snow Serum Whitening Pen - Value Pack - Bundle of Three,1,
2026-05-14 22:20:46,#16190,Heidi Tan,96693211,"59 Canberra Drive
#03-04
Singapore 769304",BLU Teeth Whitening Kit - Free Whitening Toothpaste + Free Snow Serum Whitening Pen + 1 Year Warranty (Worth $230),1,SF5191848438823
2026-05-15 02:00:29,#16195,Peizhen Ang,6593624536,"351 Choa Chu Kang Avenue 3 #02-01
Singapore 689879",SmileFam Refiller Pack (Contains 2 Refillers) - I will skip this!,1,SF5191167028441`;

const sampleMaster = `Alias,Canonical SKU,Component SKU,Component Name,Units Per Qty,Skip
Whitening Electric Toothbrush Bundle - Free Whitening Toothpaste + Free Premium Travel Case + 1 Year Warranty (Worth $168),BLU-BRUSH-BUNDLE,BLU-BRUSH,BLU Electric Toothbrush,1,No
Whitening Electric Toothbrush Bundle - Free Whitening Toothpaste + Free Premium Travel Case + 1 Year Warranty (Worth $168),BLU-BRUSH-BUNDLE,BLU-PASTE,BLU Whitening Toothpaste,1,No
Whitening Electric Toothbrush Bundle - Free Whitening Toothpaste + Free Premium Travel Case + 1 Year Warranty (Worth $168),BLU-BRUSH-BUNDLE,TRAVEL-CASE,Premium Travel Case,1,No
SmileFam Refiller Pack (Contains 2 Refillers),SF-REFILL-2PK,SF-REFILL,SmileFam Refillers,2,No
BLU Whitening Toothpaste - One Tube,BLU-PASTE-1,BLU-PASTE,BLU Whitening Toothpaste,1,No
BLU Teeth Whitening Kit - Free Whitening Toothpaste + Free Snow Serum Whitening Pen + 1 Year Warranty (Worth $230),BLU-KIT,BLU-KIT,BLU Teeth Whitening Kit,1,No
BLU Teeth Whitening Kit - Free Whitening Toothpaste + Free Snow Serum Whitening Pen + 1 Year Warranty (Worth $230),BLU-KIT,BLU-PASTE,BLU Whitening Toothpaste,1,No
BLU Teeth Whitening Kit - Free Whitening Toothpaste + Free Snow Serum Whitening Pen + 1 Year Warranty (Worth $230),BLU-KIT,SNOW-PEN,Snow Serum Whitening Pen,1,No
Snow Serum Whitening Pen - Value Pack - Bundle of Three,SNOW-PEN-3PK,SNOW-PEN,Snow Serum Whitening Pen,3,No
I will skip this,SKIP,SKIP,Option text to ignore,0,No`;

const defaultGoogleSheetUrl =
  "https://docs.google.com/spreadsheets/d/1HDuuRtvyMHS6ekOprhrAGlpyQ4748_SoCxbtRM-lcIs/edit?gid=0#gid=0";
const inventorySeed = Array.isArray(window.SMILEFAM_INVENTORY) ? window.SMILEFAM_INVENTORY : [];
const workbookMasterCsv = typeof window.SMILEFAM_MASTER_CSV === "string" ? window.SMILEFAM_MASTER_CSV : "";

const state = {
  allOrders: [],
  batchOrders: [],
  duplicateOrders: [],
  selectedRows: new Set(),
  orders: [],
  rules: [],
  processed: [],
  picklist: [],
  review: [],
  labels: [],
  inventory: inventorySeed,
  generatedSelection: new Set(),
  pendingProcess: null,
  matchedLines: 0,
  lastFetchAt: null,
  selectedReview: null,
  overrides: new Map(),
  rowEdits: new Map(),
  processedKeys: new Set(),
  exports: { orders: "", picklist: "", labels: "" },
};

const els = {
  dateMode: document.querySelector("#dateMode"),
  singleDate: document.querySelector("#singleDate"),
  startDate: document.querySelector("#startDate"),
  endDate: document.querySelector("#endDate"),
  singleDateField: document.querySelector("#singleDateField"),
  startDateField: document.querySelector("#startDateField"),
  endDateField: document.querySelector("#endDateField"),
  loadSample: document.querySelector("#loadSample"),
  processData: document.querySelector("#processData"),
  processSelected: document.querySelector("#processSelected"),
  googleSheetUrl: document.querySelector("#googleSheetUrl"),
  fetchStatus: document.querySelector("#fetchStatus"),
  ordersFile: document.querySelector("#ordersFile"),
  masterFile: document.querySelector("#masterFile"),
  ordersInput: document.querySelector("#ordersInput"),
  masterInput: document.querySelector("#masterInput"),
  statusText: document.querySelector("#statusText"),
  ordersToday: document.querySelector("#ordersToday"),
  linesToday: document.querySelector("#linesToday"),
  matchedLines: document.querySelector("#matchedLines"),
  needsReview: document.querySelector("#needsReview"),
  inventoryTable: document.querySelector("#inventoryTable"),
  inventoryStatus: document.querySelector("#inventoryStatus"),
  ordersTable: document.querySelector("#ordersTable"),
  generatedTable: document.querySelector("#generatedTable"),
  selectAllOrders: document.querySelector("#selectAllOrders"),
  selectVisibleOrders: document.querySelector("#selectVisibleOrders"),
  clearSelectedOrders: document.querySelector("#clearSelectedOrders"),
  picklistTable: document.querySelector("#picklistTable"),
  reviewTable: document.querySelector("#reviewTable"),
  labelsGrid: document.querySelector("#labelsGrid"),
  rulesTable: document.querySelector("#rulesTable"),
  excludeProcessed: document.querySelector("#excludeProcessed"),
  exportOrders: document.querySelector("#exportOrders"),
  exportPicklist: document.querySelector("#exportPicklist"),
  exportLabels: document.querySelector("#exportLabels"),
  printLabels: document.querySelector("#printLabels"),
  degenerateSelected: document.querySelector("#degenerateSelected"),
  markProcessed: document.querySelector("#markProcessed"),
  processDialog: document.querySelector("#processDialog"),
  processDialogTitle: document.querySelector("#processDialogTitle"),
  processImpactSummary: document.querySelector("#processImpactSummary"),
  processImpactTable: document.querySelector("#processImpactTable"),
  confirmProcess: document.querySelector("#confirmProcess"),
  cancelProcess: document.querySelector("#cancelProcess"),
  reviewDialog: document.querySelector("#reviewDialog"),
  closeReview: document.querySelector("#closeReview"),
  reviewOrderRef: document.querySelector("#reviewOrderRef"),
  reviewIssue: document.querySelector("#reviewIssue"),
  reviewFreeText: document.querySelector("#reviewFreeText"),
  reviewComponent: document.querySelector("#reviewComponent"),
  reviewUnits: document.querySelector("#reviewUnits"),
  amendOrderRef: document.querySelector("#amendOrderRef"),
  amendCustomer: document.querySelector("#amendCustomer"),
  amendPhone: document.querySelector("#amendPhone"),
  amendQty: document.querySelector("#amendQty"),
  amendAddress: document.querySelector("#amendAddress"),
  amendItemText: document.querySelector("#amendItemText"),
  applyAmendment: document.querySelector("#applyAmendment"),
  skipReviewLine: document.querySelector("#skipReviewLine"),
  applyReviewOverride: document.querySelector("#applyReviewOverride"),
};

function todayForInput() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some((value) => value.trim() !== "")) rows.push(row);
  return rows;
}

function storageGet(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Local storage can be blocked in some private browsing modes.
  }
}

function rowsToObjects(rows) {
  if (rows.length === 0) return [];
  const seen = new Map();
  const headers = rows[0].map((header, index) => {
    let name = cleanHeader(header);
    if (!/[a-z0-9]/i.test(name)) {
      name = index === 0 ? "Date" : index === 1 ? "Order reference" : `Column ${index + 1}`;
    }
    if (seen.has(name)) {
      seen.set(name, seen.get(name) + 1);
      return `${name} ${seen.get(name)}`;
    }
    seen.set(name, 1);
    return name;
  });
  return rows.slice(1).map((row) => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = (row[index] || "").trim();
    });
    record.__cells = row.map((value) => (value || "").trim());
    return record;
  });
}

function cleanHeader(value) {
  return String(value || "")
    .replace(/^\uFEFF/, "")
    .trim();
}

function getField(record, candidates) {
  const entries = Object.entries(record);
  for (const candidate of candidates) {
    const wanted = normalizeKey(candidate);
    const found = entries.find(([key]) => normalizeKey(key) === wanted);
    if (found) return found[1];
  }
  for (const candidate of candidates) {
    const wanted = normalizeKey(candidate);
    const found = entries.find(([key]) => normalizeKey(key).includes(wanted));
    if (found) return found[1];
  }
  return "";
}

function normalizeKey(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeSku(value) {
  return String(value || "").toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\bi\s+will\s+skip\s+this\b/g, " ")
    .replace(/\bskip\s+this\b/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(free|worth|save|popular|bundle|contains|with|and|the|a|an)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function looksLikePhone(value) {
  const text = String(value || "").trim();
  const digits = text.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15 && !/[a-z]/i.test(text.replace(/ext|x/gi, ""));
}

function looksLikeProduct(value) {
  return /(smilefam|blu|whitening|toothbrush|refiller|serum|pen|kit|charger|toothpaste|bundle)/i.test(String(value || ""));
}

function extractPostalCode(address) {
  const matches = String(address || "").match(/\b\d{6}\b/g);
  return matches ? matches[matches.length - 1] : "";
}

const malaysiaPostcodePrefixes = [
  { names: ["johor"], ranges: [[79, 86]] },
  { names: ["kedah"], ranges: [[5, 9]] },
  { names: ["kelantan"], ranges: [[15, 18]] },
  { names: ["melaka", "malacca"], ranges: [[75, 78]] },
  { names: ["negeri sembilan"], ranges: [[70, 73]] },
  { names: ["pahang"], ranges: [[25, 28], [39, 39], [49, 49], [69, 69]] },
  { names: ["penang", "pulau pinang"], ranges: [[10, 14]] },
  { names: ["perak"], ranges: [[30, 36], [39, 39]] },
  { names: ["perlis"], ranges: [[1, 2]] },
  { names: ["sabah", "labuan"], ranges: [[87, 91]] },
  { names: ["sarawak"], ranges: [[93, 98]] },
  { names: ["selangor"], ranges: [[40, 48], [63, 64]] },
  { names: ["kuala lumpur", "kl"], ranges: [[50, 60]] },
  { names: ["putrajaya"], ranges: [[62, 62]] },
  { names: ["terengganu"], ranges: [[20, 24]] },
];

const usZipPrefixes = [
  { names: ["alabama", "al"], ranges: [[350, 369]] },
  { names: ["alaska", "ak"], ranges: [[995, 999]] },
  { names: ["arizona", "az"], ranges: [[850, 865]] },
  { names: ["arkansas", "ar"], ranges: [[716, 729], [755, 755]] },
  { names: ["california", "ca"], ranges: [[900, 961]] },
  { names: ["colorado", "co"], ranges: [[800, 816]] },
  { names: ["connecticut", "ct"], ranges: [[60, 69]] },
  { names: ["delaware", "de"], ranges: [[197, 199]] },
  { names: ["district of columbia", "dc"], ranges: [[200, 205]] },
  { names: ["florida", "fl"], ranges: [[320, 349]] },
  { names: ["georgia", "ga"], ranges: [[300, 319], [398, 399]] },
  { names: ["hawaii", "hi"], ranges: [[967, 968]] },
  { names: ["idaho", "id"], ranges: [[832, 838]] },
  { names: ["illinois", "il"], ranges: [[600, 629]] },
  { names: ["indiana", "in"], ranges: [[460, 479]] },
  { names: ["iowa", "ia"], ranges: [[500, 528]] },
  { names: ["kansas", "ks"], ranges: [[660, 679]] },
  { names: ["kentucky", "ky"], ranges: [[400, 427]] },
  { names: ["louisiana", "la"], ranges: [[700, 714]] },
  { names: ["maine", "me"], ranges: [[39, 49]] },
  { names: ["maryland", "md"], ranges: [[206, 219]] },
  { names: ["massachusetts", "ma"], ranges: [[10, 27], [55, 55]] },
  { names: ["michigan", "mi"], ranges: [[480, 499]] },
  { names: ["minnesota", "mn"], ranges: [[550, 567]] },
  { names: ["mississippi", "ms"], ranges: [[386, 397]] },
  { names: ["missouri", "mo"], ranges: [[630, 658]] },
  { names: ["montana", "mt"], ranges: [[590, 599]] },
  { names: ["nebraska", "ne"], ranges: [[680, 693]] },
  { names: ["nevada", "nv"], ranges: [[889, 898]] },
  { names: ["new hampshire", "nh"], ranges: [[30, 38]] },
  { names: ["new jersey", "nj"], ranges: [[70, 89]] },
  { names: ["new mexico", "nm"], ranges: [[870, 884]] },
  { names: ["new york", "ny"], ranges: [[5, 5], [100, 149]] },
  { names: ["north carolina", "nc"], ranges: [[270, 289]] },
  { names: ["north dakota", "nd"], ranges: [[580, 588]] },
  { names: ["ohio", "oh"], ranges: [[430, 459]] },
  { names: ["oklahoma", "ok"], ranges: [[730, 749]] },
  { names: ["oregon", "or"], ranges: [[970, 979]] },
  { names: ["pennsylvania", "pa"], ranges: [[150, 196]] },
  { names: ["rhode island", "ri"], ranges: [[28, 29]] },
  { names: ["south carolina", "sc"], ranges: [[290, 299]] },
  { names: ["south dakota", "sd"], ranges: [[570, 577]] },
  { names: ["tennessee", "tn"], ranges: [[370, 385]] },
  { names: ["texas", "tx"], ranges: [[750, 799], [885, 885]] },
  { names: ["utah", "ut"], ranges: [[840, 847]] },
  { names: ["vermont", "vt"], ranges: [[50, 59]] },
  { names: ["virginia", "va"], ranges: [[201, 246]] },
  { names: ["washington", "wa"], ranges: [[980, 994]] },
  { names: ["west virginia", "wv"], ranges: [[247, 268]] },
  { names: ["wisconsin", "wi"], ranges: [[530, 549]] },
  { names: ["wyoming", "wy"], ranges: [[820, 831]] },
];

function textHasPlace(text, place) {
  const escaped = place.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(text);
}

function findPlaceRule(address, rules) {
  return rules.find((rule) => rule.names.some((name) => textHasPlace(address, name)));
}

function inRanges(value, ranges) {
  return ranges.some(([start, end]) => value >= start && value <= end);
}

function detectAddressCountry(address) {
  const text = String(address || "");
  const hasSingapore = textHasPlace(text, "singapore");
  const hasMalaysia = textHasPlace(text, "malaysia") || findPlaceRule(text, malaysiaPostcodePrefixes);
  const hasUnitedStates =
    textHasPlace(text, "united states") ||
    textHasPlace(text, "usa") ||
    textHasPlace(text, "u s a") ||
    findPlaceRule(text, usZipPrefixes);

  return { hasSingapore, hasMalaysia, hasUnitedStates };
}

function validatePostalCode(address) {
  const issues = [];
  const text = String(address || "");
  if (!text.trim()) return issues;

  const countries = detectAddressCountry(text);
  const countryCount = [countries.hasSingapore, countries.hasMalaysia, countries.hasUnitedStates].filter(Boolean).length;
  if (countryCount > 1) {
    issues.push("Address contains multiple country or state indicators; verify postal code and country.");
    return issues;
  }

  if (countries.hasSingapore) {
    const matches = text.match(/\b\d{6}\b/g) || [];
    const postal = matches[matches.length - 1] || "";
    const firstTwo = Number(postal.slice(0, 2));
    if (!postal) {
      issues.push("Singapore address should include a 6-digit postal code.");
    } else if (firstTwo < 1 || firstTwo > 82) {
      issues.push("Singapore postal code does not match Singapore postal-code range.");
    }
    return issues;
  }

  if (countries.hasMalaysia) {
    const matches = text.match(/\b\d{5}\b/g) || [];
    const postal = matches[matches.length - 1] || "";
    if (!postal) {
      issues.push("Malaysia address should include a 5-digit postcode.");
      return issues;
    }
    const stateRule = findPlaceRule(text, malaysiaPostcodePrefixes);
    if (stateRule && !inRanges(Number(postal.slice(0, 2)), stateRule.ranges)) {
      issues.push("Malaysia postcode prefix does not tally with the state in the address.");
    }
    return issues;
  }

  if (countries.hasUnitedStates) {
    const matches = text.match(/\b\d{5}(?:-\d{4})?\b/g) || [];
    const zip = matches[matches.length - 1] || "";
    if (!zip) {
      issues.push("US address should include a 5-digit ZIP code or ZIP+4.");
      return issues;
    }
    const stateRule = findPlaceRule(text, usZipPrefixes);
    if (stateRule && !inRanges(Number(zip.slice(0, 3)), stateRule.ranges)) {
      issues.push("US ZIP code prefix does not tally with the state in the address.");
    }
  }

  return issues;
}

function validateClientLine(line) {
  const issues = [];
  if (!dateKey(line.date)) issues.push("Missing or invalid order date.");
  if (!line.orderRef || (!line.orderRef.startsWith("#") && !/^ROW-/i.test(line.orderRef))) {
    issues.push("Order reference should be present and normally starts with #.");
  }
  if (!line.customer) issues.push("Customer name is missing.");
  const phoneDigits = String(line.phone || "").replace(/\D/g, "");
  if (phoneDigits.length < 8 || phoneDigits.length > 15) issues.push("Phone number looks invalid.");
  if (!line.address || String(line.address).trim().length < 10) issues.push("Shipping address is missing or too short.");
  issues.push(...validatePostalCode(line.address));
  if (!line.itemText || !looksLikeProduct(line.itemText)) issues.push("Item text does not look like a Smilefam product.");
  if (!Number.isFinite(line.qty) || line.qty <= 0) issues.push("Quantity must be greater than 0.");
  return issues;
}

function parseDate(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;

  const dateParts = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (dateParts) {
    const [, first, second, year, hour = 0, minute = 0, secondPart = 0] = dateParts;
    const firstNum = Number(first);
    const secondNum = Number(second);
    const month = firstNum > 12 ? secondNum : firstNum;
    const day = firstNum > 12 ? firstNum : secondNum;
    return new Date(Number(year), month - 1, day, Number(hour), Number(minute), Number(secondPart));
  }

  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) return direct;

  const textParts = raw.match(/^(\d{1,2})(st|nd|rd|th)?\s+([a-z]+)\s+(\d{4})$/i);
  if (textParts) {
    const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const monthIndex = months.findIndex((month) => textParts[3].toLowerCase().startsWith(month));
    if (monthIndex >= 0) return new Date(Number(textParts[4]), monthIndex, Number(textParts[1]));
  }

  return null;
}

function dateKey(date) {
  if (!date) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function orderProcessKey(order) {
  return [dateKey(order.date), order.orderRef, order.customer].map((part) => normalizeKey(part)).join("|");
}

function rowSelectionKey(order) {
  return String(order.sourceRow);
}

function getBatchLabel() {
  if (els.dateMode.value === "range") return `${els.startDate.value} to ${els.endDate.value}`;
  if (els.dateMode.value === "single") return els.singleDate.value;
  return els.singleDate.value || todayForInput();
}

function isInBatch(order) {
  const key = dateKey(order.date);
  if (!key) return false;
  if (els.dateMode.value === "range") {
    return key >= els.startDate.value && key <= els.endDate.value;
  }
  return key === els.singleDate.value;
}

function latestOrderDateKey(orders) {
  return orders
    .map((order) => dateKey(order.date))
    .filter(Boolean)
    .sort()
    .pop() || "";
}

function syncDateControls() {
  const today = todayForInput();
  if (!els.singleDate.value) els.singleDate.value = today;
  if (!els.startDate.value) els.startDate.value = today;
  if (!els.endDate.value) els.endDate.value = today;

  const rangeMode = els.dateMode.value === "range";
  els.singleDateField.classList.toggle("hidden", rangeMode);
  els.startDateField.classList.toggle("hidden", !rangeMode);
  els.endDateField.classList.toggle("hidden", !rangeMode);
}

function normalizeOrder(record, index) {
  const cells = Array.isArray(record.__cells) ? record.__cells : [];
  const shiftedCurrentLayout = looksLikePhone(cells[3]) && looksLikeProduct(cells[5]);
  const dateRaw = cells[0] || getField(record, ["Date", "Created At", "Timestamp", "Order Date"]);
  const orderRef = cells[1] || getField(record, ["Order reference", "Order ID", "Order Number", "Order", "Name"]) || `ROW-${index + 1}`;
  const customer = cells[2] || getField(record, ["Full Name", "Name", "Customer Name"]);
  const phone = shiftedCurrentLayout ? cells[3] : getField(record, ["Phone Number", "Phone", "Mobile"]);
  const address = shiftedCurrentLayout ? cells[4] : getField(record, ["Shipping Address", "Address"]);
  const itemText = shiftedCurrentLayout ? cells[5] : getField(record, ["Items", "Item", "Product", "Product Name"]);
  const qty = shiftedCurrentLayout ? cells[6] : getField(record, ["Quantity", "Qty"]);
  const deliveryStatus = shiftedCurrentLayout ? cells[7] : getField(record, ["Delivery Status", "Status"]);
  const tracking = shiftedCurrentLayout ? cells[8] : getField(record, ["Delivery Tracking Number", "Waybill Reference", "Tracking Number"]);
  const order = {
    sourceRow: index + 2,
    dateRaw,
    date: parseDate(dateRaw),
    orderRef,
    customer,
    phone,
    address,
    itemText,
    qty: Number(qty || 1) || 1,
    deliveryStatus,
    tracking,
  };
  return applyRowEdit(order);
}

function applyRowEdit(order) {
  const edit = state.rowEdits.get(String(order.sourceRow));
  if (!edit) return order;
  const next = { ...order, ...edit };
  if (edit.dateRaw) next.date = parseDate(edit.dateRaw);
  if (edit.qty) next.qty = Number(edit.qty) || order.qty;
  return next;
}

function normalizeRule(record, index) {
  const alias = getField(record, ["Alias", "Permutation", "Client Item", "Item", "Free Text", "Items"]);
  const canonicalSku = getField(record, ["Canonical SKU", "Mapped SKU", "Parent SKU", "SKU"]) || alias;
  const componentSku = getField(record, ["Component SKU", "Output SKU", "Pick SKU", "SKU"]) || canonicalSku;
  const componentName =
    getField(record, ["Component Name", "Output Item", "Pick Item", "Product Name", "Name"]) || componentSku;
  const unitsPerQty = Number(getField(record, ["Units Per Qty", "Units", "Component Qty", "Qty"]) || 1);
  return {
    id: `R${index + 1}`,
    alias,
    aliasNorm: normalizeText(alias),
    canonicalSku,
    componentSku,
    componentName,
    unitsPerQty: Number.isFinite(unitsPerQty) ? unitsPerQty : 1,
    skip: false,
  };
}

function scoreRule(itemNorm, rule) {
  if (!itemNorm || !rule.aliasNorm) return 0;
  if (itemNorm === rule.aliasNorm) return 1000;
  if (itemNorm.includes(rule.aliasNorm) || rule.aliasNorm.includes(itemNorm)) return 850;

  const itemTokens = new Set(itemNorm.split(" ").filter(Boolean));
  const ruleTokens = rule.aliasNorm.split(" ").filter(Boolean);
  const hits = ruleTokens.filter((token) => itemTokens.has(token)).length;
  const coverage = hits / Math.max(ruleTokens.length, 1);
  return Math.round(coverage * 700);
}

function findRules(line, rules) {
  const override = state.overrides.get(String(line.sourceRow));
  if (override?.action === "skip") {
    return {
      rules: [],
      skipped: true,
      confidence: 1000,
      reason: "Processor override skipped this line",
    };
  }

  if (override?.action === "map") {
    return {
      rules: [
        {
          alias: line.itemText,
          canonicalSku: override.componentSku,
          componentSku: override.componentSku,
          componentName: override.componentName,
          unitsPerQty: override.unitsPerQty,
          skip: false,
        },
      ],
      skipped: false,
      confidence: 1000,
      reason: "Processor override",
    };
  }

  const norm = normalizeText(line.itemText);

  const scored = rules
    .map((rule) => ({ rule, score: scoreRule(norm, rule) }))
    .filter((entry) => entry.score >= 520)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return {
      rules: [],
      skipped: false,
      confidence: 0,
      reason: "No master-list alias matched",
    };
  }

  const topScore = scored[0].score;
  const matching = scored.filter((entry) => entry.score === topScore).map((entry) => entry.rule);
  const active = matching.filter((rule) => !rule.skip);
  const skipped = matching.length > 0 && active.length === 0;

  return {
    rules: active,
    skipped,
    confidence: topScore,
    reason: skipped ? "Matched skip rule" : topScore >= 850 ? "Alias match" : "Keyword match",
  };
}

function processAll() {
  const orderRows = rowsToObjects(parseCsv(els.ordersInput.value.trim()));
  const masterRows = rowsToObjects(parseCsv(els.masterInput.value.trim()));
  state.allOrders = orderRows.map(normalizeOrder).filter((row) => row.itemText || row.orderRef);
  if (els.dateMode.value === "today") {
    els.singleDate.value = latestOrderDateKey(state.allOrders) || todayForInput();
  }
  state.batchOrders = state.allOrders.filter(isInBatch);
  const duplicateKeys = new Set();
  state.orders = state.batchOrders.filter((order) => {
    const key = orderProcessKey(order);
    if (els.excludeProcessed.checked && state.processedKeys.has(key)) {
      duplicateKeys.add(key);
      return false;
    }
    return true;
  });
  state.duplicateOrders = [...duplicateKeys];
  state.rules = masterRows.map(normalizeRule).filter((rule) => rule.alias || rule.componentSku);
  const allowedSelections = new Set(state.orders.map(rowSelectionKey));
  state.selectedRows = new Set([...state.selectedRows].filter((key) => allowedSelections.has(key)));
  clearGeneratedOutputs();
  updateDashboard();
  renderAll();
  updateSelectionControls();
}

function processSelectedRows(options = {}) {
  if (state.selectedRows.size === 0) {
    setFetchStatus("Tick at least one client record before processing.", "error");
    return;
  }
  const selectedOrders = state.orders.filter((order) => state.selectedRows.has(rowSelectionKey(order)));
  if (selectedOrders.length === 0) {
    setFetchStatus("Selected records were already processed or are not in the current date window.", "error");
    return;
  }
  const result = createMatchingResult(selectedOrders);
  if (options.skipConfirm) {
    applyMatchingResult(result, selectedOrders.length);
    return;
  }
  state.pendingProcess = { action: "process", result, selectedCount: selectedOrders.length };
  renderProcessDialog(result, selectedOrders.length, "deplete");
  els.processDialog.showModal();
}

function confirmPendingProcess() {
  if (!state.pendingProcess) return;
  if (state.pendingProcess.action === "degenerate") {
    confirmDegenerate();
    return;
  }
  const { result, selectedCount } = state.pendingProcess;
  state.pendingProcess = null;
  els.processDialog.close();
  applyMatchingResult(result, selectedCount);
}

function promptDegenerate(keys) {
  const keySet = new Set(keys);
  const orders = state.processed.filter((order) => keySet.has(orderProcessKey(order)));
  if (orders.length === 0) {
    setFetchStatus("Select a generated order before de-generating.", "error");
    return;
  }
  state.pendingProcess = {
    action: "degenerate",
    removeKeys: [...keySet],
    selectedCount: orders.length,
    result: { picklist: buildPicklist(orders) },
  };
  renderProcessDialog(state.pendingProcess.result, orders.length, "return");
  els.processDialog.showModal();
}

function confirmDegenerate() {
  const pending = state.pendingProcess;
  if (!pending || pending.action !== "degenerate") return;
  const removeKeys = new Set(pending.removeKeys);
  const removedOrders = state.processed.filter((order) => removeKeys.has(orderProcessKey(order)));
  const removedRows = new Set(removedOrders.flatMap((order) => order.sourceRows || []));
  for (const rowKey of removedRows) state.selectedRows.delete(String(rowKey));
  for (const key of removeKeys) state.generatedSelection.delete(key);
  state.pendingProcess = null;
  els.processDialog.close();

  const remainingSelected = state.orders.filter((order) => state.selectedRows.has(rowSelectionKey(order)));
  if (remainingSelected.length) {
    applyMatchingResult(createMatchingResult(remainingSelected), remainingSelected.length);
  } else {
    clearGeneratedOutputs();
    updateDashboard();
    renderAll();
  }
  activateView("orders");
  setFetchStatus(
    `De-generated ${removedOrders.length} order${removedOrders.length === 1 ? "" : "s"}. Stock has been returned and the client records are available unselected.`,
    "ok",
  );
}

function applyMatchingResult(result, selectedCount) {
  state.processed = result.processed;
  state.picklist = result.picklist;
  state.review = result.review;
  state.labels = result.labels;
  state.matchedLines = result.matchedLines;
  state.generatedSelection.clear();
  state.exports.orders = makeOrdersCsv(state.processed);
  state.exports.picklist = makePicklistCsv(state.picklist);
  state.exports.labels = makeLabelsCsv(state.labels);
  updateDashboard();
  renderAll();
  activateView("generated");
  setFetchStatus(`Processed ${selectedCount} selected client lines. Review any flagged rows before marking processed.`, state.review.length ? "error" : "ok");
}

function clearGeneratedOutputs() {
  state.processed = [];
  state.picklist = [];
  state.review = [];
  state.labels = [];
  state.generatedSelection.clear();
  state.pendingProcess = null;
  state.matchedLines = 0;
  state.exports.orders = "";
  state.exports.picklist = "";
  state.exports.labels = "";
}

function runMatching() {
  applyMatchingResult(createMatchingResult(state.orders), state.orders.length);
}

function createMatchingResult(lines) {
  const generatedByOrder = new Map();
  const review = [];
  let matchedLines = 0;

  for (const line of lines) {
    const validationIssues = validateClientLine(line);
    const match = findRules(line, state.rules);
    if (!generatedByOrder.has(line.orderRef)) {
      generatedByOrder.set(line.orderRef, {
        orderRef: line.orderRef,
        dateRaw: line.dateRaw,
        date: line.date,
        customer: line.customer,
        phone: line.phone,
        address: line.address,
        tracking: line.tracking,
        components: new Map(),
        issues: [],
        sourceRows: new Set(),
        skippedLines: 0,
      });
    }

    const order = generatedByOrder.get(line.orderRef);
    order.sourceRows.add(rowSelectionKey(line));
    if (!order.customer && line.customer) order.customer = line.customer;
    if (!order.phone && line.phone) order.phone = line.phone;
    if (!order.address && line.address) order.address = line.address;
    if (!order.tracking && line.tracking) order.tracking = line.tracking;
    for (const validationIssue of validationIssues) {
      if (!order.issues.includes(validationIssue)) order.issues.push(validationIssue);
      review.push({
        id: `${line.sourceRow}:validation:${validationIssue}`,
        sourceRow: line.sourceRow,
        orderRef: line.orderRef,
        itemText: line.itemText,
        qty: line.qty,
        issue: validationIssue,
        action: "Check against the client sheet before fulfilment.",
      });
    }

    if (match.skipped) {
      matchedLines += 1;
      order.skippedLines += 1;
      continue;
    }

    if (match.rules.length === 0) {
      const issue = match.reason;
      order.issues.push(issue);
      review.push({
        id: String(line.sourceRow),
        sourceRow: line.sourceRow,
        orderRef: line.orderRef,
        itemText: line.itemText,
        qty: line.qty,
        issue,
        action: "Add this phrase to SharePoint master list or correct item text.",
      });
      continue;
    }

    matchedLines += 1;
    for (const rule of match.rules) {
      const units = line.qty * rule.unitsPerQty;
      const key = rule.componentSku;
      const existing = order.components.get(key) || {
        sku: rule.componentSku,
        name: rule.componentName,
        units: 0,
        sourceItems: new Set(),
      };
      existing.units += units;
      existing.sourceItems.add(line.itemText);
      order.components.set(key, existing);
    }
  }

  const processed = [...generatedByOrder.values()].map((order) => ({
    ...order,
    sourceRows: [...order.sourceRows],
    components: [...order.components.values()].map((component) => ({
      ...component,
      sourceItems: [...component.sourceItems],
    })),
  }));

  const picklist = buildPicklist(processed);
  return {
    processed,
    picklist,
    review,
    labels: buildLabels(processed),
    matchedLines,
  };
}

function buildGoogleCsvUrls(sheetUrl) {
  const urlText = String(sheetUrl || "").trim();
  if (!urlText) throw new Error("Enter a Google Sheet URL first.");
  if (urlText.includes("output=csv") || urlText.includes("format=csv")) return [urlText];

  let url;
  try {
    url = new URL(urlText);
  } catch {
    throw new Error("The Google Sheet URL is not valid.");
  }

  const idMatch = url.pathname.match(/\/spreadsheets\/d\/([^/]+)/);
  if (!idMatch) {
    throw new Error("Use a normal Google Sheets URL with /spreadsheets/d/... in it.");
  }

  const sheetId = idMatch[1];
  const gid = url.searchParams.get("gid") || (url.hash.match(/gid=(\d+)/) || [])[1] || "0";
  return [
    `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`,
    `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`,
  ];
}

async function fetchGoogleSheet() {
  const urls = buildGoogleCsvUrls(els.googleSheetUrl.value);
  let lastError = null;

  setFetchStatus("Fetching client orders...", "");

  try {
    const requestUrls = [
      ...urls.map((url) => `/api/google-sheet?url=${encodeURIComponent(url)}`),
      ...urls,
    ];

    for (const url of requestUrls) {
      try {
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) throw new Error(`Google returned ${response.status}`);
        const csv = await response.text();
        if (!csv.trim() || csv.trim().startsWith("<")) throw new Error("Google did not return CSV.");

        els.ordersInput.value = csv;
        state.lastFetchAt = new Date();
        storageSet("smilefam.googleSheetUrl", els.googleSheetUrl.value);
        processAll();
        setFetchStatus(`Retrieved ${state.orders.length} selectable client records for ${getBatchLabel()} at ${state.lastFetchAt.toLocaleTimeString()}.`, "ok");
        return true;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error("Unable to fetch the Google Sheet.");
  } catch (error) {
    setFetchStatus(
      `${error.message} Check that the sheet is shared for access or paste a published CSV URL.`,
      "error",
    );
    return false;
  }
}

async function retrieveAndProcessOrders() {
  els.processData.disabled = true;
  const originalText = els.processData.textContent;
  els.processData.textContent = "Retrieving...";

  try {
    await loadProcessedOrders();
    const fetched = await fetchGoogleSheet();
    if (!fetched && els.ordersInput.value.trim()) {
      processAll();
      setFetchStatus(`Google fetch failed, so loaded current CSV records for ${getBatchLabel()}.`, "error");
    }
  } finally {
    els.processData.disabled = false;
    els.processData.textContent = originalText;
  }
}

async function loadProcessedOrders() {
  try {
    const response = await fetch("/api/processed-orders", { cache: "no-store" });
    if (!response.ok) throw new Error("Processed-order register unavailable.");
    const payload = await response.json();
    state.processedKeys = new Set((payload.orders || []).map((order) => order.key).filter(Boolean));
  } catch {
    const localPayload = readLocalProcessedOrders();
    state.processedKeys = new Set(localPayload.orders.map((order) => order.key).filter(Boolean));
  }
}

function readLocalProcessedOrders() {
  try {
    const parsed = JSON.parse(storageGet("smilefam.processedOrders") || "{}");
    return { orders: Array.isArray(parsed.orders) ? parsed.orders : [] };
  } catch {
    return { orders: [] };
  }
}

function saveLocalProcessedOrders(orders) {
  const current = readLocalProcessedOrders();
  const byKey = new Map(current.orders.map((order) => [order.key, order]));
  const processedAt = new Date().toISOString();

  for (const order of orders) {
    if (!order?.key) continue;
    byKey.set(order.key, {
      key: order.key,
      orderRef: order.orderRef || "",
      date: order.date || "",
      customer: order.customer || "",
      tracking: order.tracking || "",
      processedAt,
    });
  }

  const next = { orders: [...byKey.values()].sort((a, b) => a.processedAt.localeCompare(b.processedAt)) };
  storageSet("smilefam.processedOrders", JSON.stringify(next));
  return next;
}

async function markBatchProcessed() {
  if (state.review.length > 0) {
    setFetchStatus("Resolve review issues before marking this batch processed.", "error");
    activateView("review");
    return;
  }

  const orders = state.processed
    .filter((order) => order.components.length > 0 && order.issues.length === 0)
    .map((order) => ({
      key: orderProcessKey(order),
      orderRef: order.orderRef,
      date: dateKey(order.date),
      customer: order.customer,
      tracking: order.tracking,
    }));

  if (orders.length === 0) {
    setFetchStatus("No ready orders to mark processed.", "error");
    return;
  }

  els.markProcessed.disabled = true;
  try {
    const response = await fetch("/api/processed-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orders }),
    });
    if (!response.ok) throw new Error("Could not save processed register.");
    const payload = await response.json();
    state.processedKeys = new Set((payload.orders || []).map((order) => order.key).filter(Boolean));
    processAll();
    setFetchStatus(`Marked ${orders.length} orders as processed. Future retrieves will skip them.`, "ok");
  } catch {
    const payload = saveLocalProcessedOrders(orders);
    state.processedKeys = new Set((payload.orders || []).map((order) => order.key).filter(Boolean));
    processAll();
    setFetchStatus(`Marked ${orders.length} orders as processed in this browser. Future retrieves here will skip them.`, "ok");
  } finally {
    els.markProcessed.disabled = state.processed.length === 0 || state.review.length > 0;
  }
}

function setFetchStatus(message, type) {
  els.fetchStatus.textContent = message;
  els.fetchStatus.classList.remove("ok", "error");
  if (type) els.fetchStatus.classList.add(type);
}

function buildPicklist(orders) {
  const pickMap = new Map();
  for (const order of orders) {
    for (const component of order.components) {
      const existing = pickMap.get(component.sku) || {
        sku: component.sku,
        name: component.name,
        units: 0,
        orders: new Set(),
      };
      existing.units += component.units;
      existing.orders.add(order.orderRef);
      pickMap.set(component.sku, existing);
    }
  }
  return [...pickMap.values()]
    .map((item) => ({ ...item, orders: [...item.orders].sort() }))
    .sort((a, b) => a.sku.localeCompare(b.sku));
}

function buildLabels(orders) {
  return orders
    .filter((order) => order.components.length > 0 && order.issues.length === 0)
    .map((order) => ({
      orderRef: order.orderRef,
      dateRaw: order.dateRaw,
      customer: order.customer,
      phone: order.phone,
      address: order.address,
      tracking: order.tracking,
      itemSummary: order.components.map((item) => `${item.sku} x ${item.units}`).join("; "),
    }));
}

function updateDashboard() {
  const batchOrders = new Set(state.orders.map((order) => order.orderRef));

  els.ordersToday.textContent = batchOrders.size;
  els.linesToday.textContent = state.orders.length;
  els.matchedLines.textContent = state.matchedLines;
  els.needsReview.textContent = state.review.length;
  const heldBack = state.duplicateOrders.length
    ? ` ${state.duplicateOrders.length} previously processed orders held back.`
    : "";
  els.statusText.textContent = state.processed.length
    ? `${state.processed.length} orders generated from ${state.selectedRows.size} selected client lines. ${state.review.length} lines need review.${heldBack}`
    : `${state.orders.length} selectable client lines loaded from ${state.batchOrders.length} batch source lines for ${getBatchLabel()}.${heldBack}`;
  els.exportOrders.disabled = state.processed.length === 0;
  els.exportPicklist.disabled = state.picklist.length === 0;
  els.exportLabels.disabled = state.labels.length === 0;
  els.printLabels.disabled = state.labels.length === 0;
  els.degenerateSelected.disabled = state.generatedSelection.size === 0;
  els.markProcessed.disabled = state.processed.length === 0 || state.review.length > 0;
  updateSelectionControls();
}

function updateSelectionControls() {
  const total = state.orders.length;
  const selected = state.orders.filter((order) => state.selectedRows.has(rowSelectionKey(order))).length;
  els.processSelected.disabled = selected === 0;
  els.selectVisibleOrders.disabled = total === 0;
  els.clearSelectedOrders.disabled = selected === 0;
  els.selectAllOrders.disabled = total === 0;
  els.selectAllOrders.checked = total > 0 && selected === total;
  els.selectAllOrders.indeterminate = selected > 0 && selected < total;
  els.processSelected.textContent = selected ? `Process selected (${selected})` : "Process selected";
}

function renderAll() {
  renderInventory();
  renderClientRecords();
  renderGeneratedOrders();
  renderPicklist();
  renderReview();
  renderLabels();
  renderRules();
}

function renderInventory() {
  const demand = new Map(state.picklist.map((item) => [normalizeSku(item.sku), item.units]));
  els.inventoryStatus.textContent = `${state.inventory.length} item types loaded from Smilefam Inventory.`;
  els.inventoryTable.innerHTML = state.inventory
    .map((item) => {
      const needed = demand.get(normalizeSku(item.sku)) || demand.get(normalizeSku(item.name)) || 0;
      const balance = Number(item.stock || 0) - needed;
      const balanceClass = balance < 0 ? "balance-low" : "balance-ok";
      return `<tr>
        <td>${escapeHtml(item.name)}</td>
        <td>${escapeHtml(item.description || item.name)}</td>
        <td>${Number(item.stock || 0)}</td>
        <td>${needed}</td>
        <td class="${balanceClass}">${balance}</td>
      </tr>`;
    })
    .join("");
}

function stockBeforeFor(item) {
  const stockItem = state.inventory.find(
    (inventoryItem) =>
      normalizeSku(inventoryItem.sku) === normalizeSku(item.sku) ||
      normalizeSku(inventoryItem.name) === normalizeSku(item.sku) ||
      normalizeSku(inventoryItem.sku) === normalizeSku(item.name) ||
      normalizeSku(inventoryItem.name) === normalizeSku(item.name),
  );
  return Number(stockItem?.stock || 0);
}

function renderProcessDialog(result, count, mode) {
  const picklist = result.picklist || [];
  const currentDemand = new Map(state.picklist.map((item) => [normalizeSku(item.sku), item.units]));
  const actionText = mode === "return" ? "returned to inventory" : "depleted from inventory";
  els.processDialogTitle.textContent = mode === "return" ? "Confirm stock return" : "Confirm stock depletion";
  els.processImpactSummary.textContent =
    picklist.length === 0
      ? `${count} ${mode === "return" ? "generated orders have" : "selected client lines have"} no stock movement.`
      : mode === "return"
        ? `${count} generated order${count === 1 ? "" : "s"} will be de-generated. These stocks will be ${actionText}.`
        : `${count} selected client lines will be processed. These stocks will be ${actionText}.`;
  els.confirmProcess.textContent = mode === "return" ? "Confirm de-generate" : "Confirm process";
  els.processImpactTable.innerHTML = picklist.length
    ? picklist
        .map((item) => {
          const stockBefore =
            mode === "return" ? stockBeforeFor(item) - (currentDemand.get(normalizeSku(item.sku)) || 0) : stockBeforeFor(item);
          const balance = mode === "return" ? stockBefore + item.units : stockBefore - item.units;
          const balanceClass = balance < 0 ? "balance-low" : "balance-ok";
          return `<tr>
            <td>${escapeHtml(item.sku)}</td>
            <td>${escapeHtml(item.name)}</td>
            <td>${stockBefore}</td>
            <td>${mode === "return" ? "+" : "-"}${item.units}</td>
            <td class="${balanceClass}">${balance}</td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="5" class="muted">No stock-moving items in this selection.</td></tr>`;
}

function renderClientRecords() {
  els.ordersTable.innerHTML = state.orders.length
    ? state.orders
        .map((order) => {
          const checked = state.selectedRows.has(rowSelectionKey(order)) ? "checked" : "";
          const processed = state.processedKeys.has(orderProcessKey(order));
          const disabled = processed && els.excludeProcessed.checked ? "disabled" : "";
          const status = processed ? "Processed" : "New";
          const statusClass = processed ? "warn" : "ok";
          return `<tr>
            <td><input type="checkbox" data-row-select="${escapeHtml(rowSelectionKey(order))}" ${checked} ${disabled} aria-label="Select ${escapeHtml(order.orderRef)}" /></td>
            <td>${escapeHtml(dateKey(order.date) || order.dateRaw)}</td>
            <td>${escapeHtml(order.orderRef)}</td>
            <td>${escapeHtml(order.customer)}</td>
            <td>${escapeHtml(order.phone)}</td>
            <td>${escapeHtml(order.itemText)}</td>
            <td>${order.qty}</td>
            <td><span class="pill ${statusClass}">${status}</span></td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="8" class="muted">No new client records for this date window.</td></tr>`;
}

function renderGeneratedOrders() {
  els.generatedTable.innerHTML = state.processed
    .map((order) => {
      const processKey = orderProcessKey(order);
      const checked = state.generatedSelection.has(processKey) ? "checked" : "";
      const items = order.components.length
        ? order.components.map((item) => `${escapeHtml(item.sku)} x ${item.units}`).join("<br>")
        : '<span class="muted">No generated items</span>';
      const status = order.issues.length
        ? '<span class="pill warn">Review</span>'
        : order.components.length
          ? '<span class="pill ok">Ready</span>'
          : '<span class="pill warn">Skipped</span>';
      return `<tr>
        <td><input type="checkbox" data-generated-select="${escapeHtml(processKey)}" ${checked} aria-label="Select generated ${escapeHtml(order.orderRef)}" /></td>
        <td>${escapeHtml(order.orderRef)}</td>
        <td>${escapeHtml(order.dateRaw)}</td>
        <td>${escapeHtml(order.customer)}</td>
        <td>${escapeHtml(order.phone)}</td>
        <td>${escapeHtml(order.address).replace(/\n/g, "<br>")}</td>
        <td>${items}</td>
        <td>${status}<br><button type="button" data-degenerate-order="${escapeHtml(processKey)}">De-generate</button></td>
      </tr>`;
    })
    .join("") || `<tr><td colspan="8" class="muted">Tick client records, then click Process selected.</td></tr>`;
}

function renderPicklist() {
  els.picklistTable.innerHTML = state.picklist
    .map(
      (item) => `<tr>
        <td>${escapeHtml(item.sku)}</td>
        <td>${escapeHtml(item.name)}</td>
        <td>${item.units}</td>
        <td>${escapeHtml(item.orders.join(", "))}</td>
      </tr>`,
    )
    .join("");
}

function renderReview() {
  els.reviewTable.innerHTML = state.review.length
    ? state.review
        .map(
          (item) => `<tr>
          <td>${escapeHtml(item.orderRef)}</td>
          <td>${escapeHtml(item.itemText)}</td>
          <td>${item.qty}</td>
          <td>${escapeHtml(item.issue)}</td>
          <td><button type="button" data-review-id="${escapeHtml(item.id)}">Review issue</button></td>
        </tr>`,
        )
        .join("")
    : `<tr><td colspan="5" class="muted">No review items.</td></tr>`;
}

function renderLabels() {
  els.labelsGrid.innerHTML = state.labels.length
    ? state.labels
        .map(
          (label) => `<article class="label-card">
            <strong>${escapeHtml(label.orderRef)}</strong>
            <div>${escapeHtml(label.customer)}</div>
            <div class="ship-to">${escapeHtml(label.address)}</div>
            <div class="label-meta">
              <span>Phone</span><span>${escapeHtml(label.phone)}</span>
              <span>Tracking</span><span>${escapeHtml(label.tracking || "Pending")}</span>
              <span>Items</span><span>${escapeHtml(label.itemSummary)}</span>
            </div>
          </article>`,
        )
        .join("")
    : '<div class="muted">No ready labels for this batch.</div>';
}

function renderRules() {
  els.rulesTable.innerHTML = state.rules
    .map(
      (rule) => `<tr>
        <td>${escapeHtml(rule.alias)}</td>
        <td>${escapeHtml(rule.canonicalSku)}</td>
        <td>${escapeHtml(rule.componentSku)}<br><span class="muted">${escapeHtml(rule.componentName)}</span></td>
        <td>${rule.unitsPerQty}</td>
        <td>${rule.skip ? "Skip" : "Fulfil"}</td>
      </tr>`,
    )
    .join("");
}

function makeOrdersCsv(orders) {
  const rows = [["Order", "Date", "Name", "Phone", "Address", "SKU", "Item", "Units", "Tracking", "Status"]];
  for (const order of orders) {
    if (order.components.length === 0) {
      rows.push([
        order.orderRef,
        order.dateRaw,
        order.customer,
        order.phone,
        order.address,
        "",
        "",
        0,
        order.tracking,
        order.issues.length ? "Review" : "Skipped",
      ]);
      continue;
    }
    for (const component of order.components) {
      rows.push([
        order.orderRef,
        order.dateRaw,
        order.customer,
        order.phone,
        order.address,
        component.sku,
        component.name,
        component.units,
        order.tracking,
        order.issues.length ? "Review" : "Ready",
      ]);
    }
  }
  return toCsv(rows);
}

function makePicklistCsv(items) {
  return toCsv([["SKU", "Item", "Units", "Orders"], ...items.map((item) => [item.sku, item.name, item.units, item.orders.join(", ")])]);
}

function makeLabelsCsv(labels) {
  return toCsv([
    ["Order", "Name", "Phone", "Address", "Tracking", "Items"],
    ...labels.map((label) => [
      label.orderRef,
      label.customer,
      label.phone,
      label.address,
      label.tracking,
      label.itemSummary,
    ]),
  ]);
}

function toCsv(rows) {
  return rows
    .map((row) =>
      row
        .map((value) => {
          const text = String(value ?? "");
          return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
        })
        .join(","),
    )
    .join("\n");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function downloadCsv(filename, content) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function uniqueComponents() {
  const map = new Map();
  for (const rule of state.rules) {
    if (rule.skip || !rule.componentSku) continue;
    if (!map.has(rule.componentSku)) {
      map.set(rule.componentSku, {
        sku: rule.componentSku,
        name: rule.componentName,
        unitsPerQty: rule.unitsPerQty || 1,
      });
    }
  }
  return [...map.values()].sort((a, b) => a.sku.localeCompare(b.sku));
}

function openReviewDialog(reviewId) {
  const item = state.review.find((entry) => entry.id === String(reviewId));
  if (!item) return;
  const line = state.orders.find((order) => String(order.sourceRow) === String(item.sourceRow));

  const components = uniqueComponents();
  state.selectedReview = item;
  els.reviewOrderRef.textContent = item.orderRef;
  els.reviewIssue.textContent = item.issue;
  els.reviewFreeText.textContent = item.itemText;
  if (line) {
    els.amendOrderRef.value = line.orderRef || "";
    els.amendCustomer.value = line.customer || "";
    els.amendPhone.value = line.phone || "";
    els.amendQty.value = line.qty || 1;
    els.amendAddress.value = line.address || "";
    els.amendItemText.value = line.itemText || "";
  }
  const validationOnly = String(item.id).includes(":validation:");
  els.reviewComponent.innerHTML = components
    .map((component) => `<option value="${escapeHtml(component.sku)}">${escapeHtml(component.sku)} - ${escapeHtml(component.name)}</option>`)
    .join("");

  const first = components[0];
  els.reviewUnits.value = first ? first.unitsPerQty : 1;
  els.applyReviewOverride.disabled = validationOnly || components.length === 0;
  els.skipReviewLine.disabled = validationOnly;
  els.reviewDialog.showModal();
}

function applyAmendment() {
  const item = state.selectedReview;
  if (!item) return;
  state.rowEdits.set(String(item.sourceRow), {
    orderRef: els.amendOrderRef.value.trim(),
    customer: els.amendCustomer.value.trim(),
    phone: els.amendPhone.value.trim(),
    qty: Number(els.amendQty.value || 1),
    address: els.amendAddress.value.trim(),
    itemText: els.amendItemText.value.trim(),
  });
  els.reviewDialog.close();
  processAll();
  state.selectedRows.add(String(item.sourceRow));
  processSelectedRows({ skipConfirm: true });
}

function applyReviewOverride() {
  const item = state.selectedReview;
  const selected = uniqueComponents().find((component) => component.sku === els.reviewComponent.value);
  if (!item || !selected) return;

  state.overrides.set(String(item.sourceRow), {
    action: "map",
    componentSku: selected.sku,
    componentName: selected.name,
    unitsPerQty: Number(els.reviewUnits.value || selected.unitsPerQty || 1),
  });

  els.reviewDialog.close();
  processSelectedRows({ skipConfirm: true });
}

function skipReviewLine() {
  const item = state.selectedReview;
  if (!item) return;
  state.overrides.set(String(item.sourceRow), { action: "skip" });
  els.reviewDialog.close();
  processSelectedRows({ skipConfirm: true });
}

async function readFileInto(fileInput, textArea) {
  const file = fileInput.files[0];
  if (!file) return;
  textArea.value = await file.text();
}

document.querySelectorAll(".tab").forEach((button) => {
  button.addEventListener("click", () => {
    activateView(button.dataset.view);
  });
});

function activateView(viewName) {
  document.querySelectorAll(".tab").forEach((tabButton) => {
    tabButton.classList.toggle("active", tabButton.dataset.view === viewName);
  });
  document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
  const view = document.querySelector(`#${viewName}View`);
  if (view) view.classList.add("active");
}

syncDateControls();
els.googleSheetUrl.value = storageGet("smilefam.googleSheetUrl") || defaultGoogleSheetUrl;
els.masterInput.value = workbookMasterCsv || sampleMaster;
renderInventory();
els.loadSample.addEventListener("click", () => {
  els.ordersInput.value = sampleOrders;
  els.masterInput.value = workbookMasterCsv || sampleMaster;
  setFetchStatus("Sample data loaded.", "ok");
  processAll();
});
els.processData.addEventListener("click", retrieveAndProcessOrders);
els.processSelected.addEventListener("click", processSelectedRows);
els.confirmProcess.addEventListener("click", confirmPendingProcess);
els.cancelProcess.addEventListener("click", () => {
  state.pendingProcess = null;
  els.processDialog.close();
});
els.dateMode.addEventListener("change", () => {
  syncDateControls();
  processAll();
});
els.singleDate.addEventListener("change", processAll);
els.startDate.addEventListener("change", processAll);
els.endDate.addEventListener("change", processAll);
els.ordersFile.addEventListener("change", () => readFileInto(els.ordersFile, els.ordersInput));
els.masterFile.addEventListener("change", () => readFileInto(els.masterFile, els.masterInput));
els.ordersTable.addEventListener("change", (event) => {
  const checkbox = event.target.closest("[data-row-select]");
  if (!checkbox) return;
  if (checkbox.checked) {
    state.selectedRows.add(checkbox.dataset.rowSelect);
  } else {
    state.selectedRows.delete(checkbox.dataset.rowSelect);
  }
  updateSelectionControls();
});
els.selectAllOrders.addEventListener("change", () => {
  if (els.selectAllOrders.checked) {
    state.selectedRows = new Set(state.orders.map(rowSelectionKey));
    renderClientRecords();
    updateSelectionControls();
  } else {
    state.selectedRows.clear();
    clearGeneratedOutputs();
    renderAll();
    updateDashboard();
  }
});
els.selectVisibleOrders.addEventListener("click", () => {
  state.selectedRows = new Set(state.orders.map(rowSelectionKey));
  renderClientRecords();
  updateSelectionControls();
});
els.clearSelectedOrders.addEventListener("click", () => {
  state.selectedRows.clear();
  renderClientRecords();
  updateSelectionControls();
});
els.exportOrders.addEventListener("click", () => downloadCsv("smilefam-generated-orders.csv", state.exports.orders));
els.exportPicklist.addEventListener("click", () => downloadCsv("smilefam-picklist.csv", state.exports.picklist));
els.exportLabels.addEventListener("click", () => downloadCsv("smilefam-order-labels.csv", state.exports.labels));
els.printLabels.addEventListener("click", () => window.print());
els.markProcessed.addEventListener("click", markBatchProcessed);
els.degenerateSelected.addEventListener("click", () => promptDegenerate(state.generatedSelection));
els.generatedTable.addEventListener("change", (event) => {
  const checkbox = event.target.closest("[data-generated-select]");
  if (!checkbox) return;
  if (checkbox.checked) {
    state.generatedSelection.add(checkbox.dataset.generatedSelect);
  } else {
    state.generatedSelection.delete(checkbox.dataset.generatedSelect);
  }
  updateDashboard();
});
els.generatedTable.addEventListener("click", (event) => {
  const button = event.target.closest("[data-degenerate-order]");
  if (button) promptDegenerate([button.dataset.degenerateOrder]);
});
els.reviewTable.addEventListener("click", (event) => {
  const button = event.target.closest("[data-review-id]");
  if (button) openReviewDialog(button.dataset.reviewId);
});
els.reviewComponent.addEventListener("change", () => {
  const selected = uniqueComponents().find((component) => component.sku === els.reviewComponent.value);
  if (selected) els.reviewUnits.value = selected.unitsPerQty;
});
els.closeReview.addEventListener("click", () => els.reviewDialog.close());
els.applyAmendment.addEventListener("click", applyAmendment);
els.applyReviewOverride.addEventListener("click", applyReviewOverride);
els.skipReviewLine.addEventListener("click", skipReviewLine);
els.excludeProcessed.addEventListener("change", () => {
  processAll();
  setFetchStatus(
    els.excludeProcessed.checked
      ? "Processed records are excluded from selection."
      : "Processed records are visible for reprocessing if selected.",
    els.excludeProcessed.checked ? "ok" : "error",
  );
});

loadProcessedOrders();
