import type { Kind } from '$lib/finance';

/**
 * Cash App CSV → ledger entries. We only import rows that actually move the
 * user's net worth: "Add Cash", "repayment", and savings-transfer rows are
 * internal book-keeping inside Cash App (debit card → cash balance, etc.) and
 * would double-count if recorded as income/expense.
 */

// Map named US timezones in the CSV to fixed offsets so Date parsing is
// deterministic regardless of where the server runs. We don't model the full
// IANA database — only the zones Cash App actually emits.
const TZ_OFFSETS: Record<string, string> = {
	CDT: '-05:00',
	CST: '-06:00',
	EDT: '-04:00',
	EST: '-05:00',
	MDT: '-06:00',
	MST: '-07:00',
	PDT: '-07:00',
	PST: '-08:00'
};

function parseRow(line: string): string[] {
	const out: string[] = [];
	let cur = '';
	let inQuotes = false;
	for (let i = 0; i < line.length; i++) {
		const c = line[i];
		if (inQuotes) {
			if (c === '"') {
				if (line[i + 1] === '"') {
					cur += '"';
					i++;
				} else {
					inQuotes = false;
				}
			} else {
				cur += c;
			}
		} else if (c === ',') {
			out.push(cur);
			cur = '';
		} else if (c === '"') {
			inQuotes = true;
		} else {
			cur += c;
		}
	}
	out.push(cur);
	return out;
}

function parseDate(s: string): Date | null {
	const m = s.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}) ([A-Z]{2,4})$/);
	if (!m) return null;
	const [, date, time, tz] = m;
	const off = TZ_OFFSETS[tz];
	if (!off) return null;
	const d = new Date(`${date}T${time}${off}`);
	return Number.isNaN(d.getTime()) ? null : d;
}

function parseAmount(s: string): number | null {
	const cleaned = s.replace(/[$,\s]/g, '');
	if (!cleaned) return null;
	const n = Number(cleaned);
	return Number.isFinite(n) ? n : null;
}

// Merchant-name → category heuristics. Order matters: more specific patterns
// (named brands) win over generic ones. Anything unmatched falls through to
// "Other" so the user can re-tag in the edit drawer.
const PATTERNS: Array<{ re: RegExp; tag: string }> = [
	{
		re: /\b(spotify|netflix|hulu|disney|hbo|peacock|paramount|prime video|apple music|youtube premium|claude\.?ai|claude|openai|chatgpt|mongodb|aws|gcp|google cloud|github|gitlab|cloudflare|digitalocean|adobe|microsoft 365|notion|figma|linear|vercel|hosting|domain)\b/i,
		tag: 'Utilities'
	},
	{
		re: /\b(racetrac|quiktrip|\bqt\b|texaco|chevron|exxon|shell|mobil|7-?eleven|circle k|valero|gulf|sunoco|conoco|phillips 66|loves|love'?s|wawa|sheetz|kum & go|murphy|gas|fuel|uber|lyft|parking|toll|metro|transit)\b/i,
		tag: 'Transport'
	},
	{
		re: /\b(braum'?s|taco bell|taco bueno|taco cabana|little caesars|alvarado|mcdonald'?s|wendy'?s|burger king|chick-?fil-?a|chipotle|subway|pizza|kfc|sonic|whataburger|panera|starbucks|dunkin|domino|papa john|jimmy john|jersey mike|five guys|in-?n-?out|popeye'?s|raising cane|culver|arby'?s|hardee|carl'?s jr|olive garden|applebee|chili'?s|outback|red lobster|texas roadhouse|cracker barrel|ihop|denny'?s|waffle house|cheesecake factory|panda express|qdoba|moe'?s|firehouse|steakhouse|restaurant|cafe|coffee|deli|bakery|bistro|grill|diner|burrito|sushi|thai|chinese|mexican rest|italian rest|bbq|sandwich)\b/i,
		tag: 'Food & dining'
	},
	{
		re: /\b(beer|liquor|wine|bar\b|pub|brewery|tavern|game|steam|playstation|xbox|cinema|movie|theater|theatre|amc|regal|concert|ticketmaster|stubhub)\b/i,
		tag: 'Entertainment'
	},
	{
		re: /\b(cvs|walgreens|rite aid|pharmacy|drug ?store|clinic|hospital|doctor|dental|dentist|optical|vision)\b/i,
		tag: 'Health'
	},
	{
		re: /\b(amazon|walmart|target|costco|sam'?s club|best buy|home depot|lowe'?s|ikea|kohl'?s|macy'?s|nordstrom|ebay|etsy)\b/i,
		tag: 'Shopping'
	}
];

function classifyExpense(notes: string, type: string): string {
	const text = `${notes} ${type}`;
	for (const { re, tag } of PATTERNS) if (re.test(text)) return tag;
	return 'Other';
}

// Cash App internal movements that don't change net worth — funding the cash
// balance from a linked debit card, savings sweeps, overdraft mechanics.
const INTERNAL_NOTES =
	/^(add cash|repayment|non-repayment update|savings|new device login|.*device login.*)$/i;
const INTERNAL_TYPES = /^(account notifications|savings internal transfer|overdraft)$/i;

export type ImportRow = {
	kind: Kind;
	amountCents: number;
	tag: string;
	note: string | null;
	occurredAt: Date;
};

export type ImportResult = {
	rows: ImportRow[];
	scanned: number;
	skipped: number;
};

export function parseCashAppCsv(
	text: string,
	today: { year: number; month: number; day: number }
): ImportResult {
	const lines = text.split(/\r?\n/).filter((l) => l.trim());
	if (lines.length === 0) return { rows: [], scanned: 0, skipped: 0 };

	const header = parseRow(lines[0]);
	const col = (name: string) => header.indexOf(name);
	const cDate = col('Date');
	const cType = col('Transaction Type');
	const cNet = col('Net Amount');
	const cStatus = col('Status');
	const cNotes = col('Notes');

	if (cDate < 0 || cType < 0 || cNet < 0 || cStatus < 0 || cNotes < 0) {
		throw new Error('CSV is missing required Cash App columns.');
	}

	const todayStr = `${today.year}-${String(today.month).padStart(2, '0')}-${String(
		today.day
	).padStart(2, '0')}`;

	const rows: ImportRow[] = [];
	let scanned = 0;
	let skipped = 0;
	for (let i = 1; i < lines.length; i++) {
		scanned++;
		const cells = parseRow(lines[i]);

		const status = cells[cStatus] ?? '';
		if (status !== 'COMPLETE' && status !== 'WAITING_ON_RECIPIENT') {
			skipped++;
			continue;
		}

		const rawDate = cells[cDate] ?? '';
		// Filter to "today" by comparing the calendar-date prefix in the CSV's own
		// timezone — avoids a server-TZ-vs-user-TZ mismatch shifting the day.
		if (rawDate.slice(0, 10) !== todayStr) {
			skipped++;
			continue;
		}

		const type = cells[cType] ?? '';
		const notes = cells[cNotes] ?? '';
		if (INTERNAL_TYPES.test(type) || INTERNAL_NOTES.test(notes)) {
			skipped++;
			continue;
		}

		const occurredAt = parseDate(rawDate);
		if (!occurredAt) {
			skipped++;
			continue;
		}

		const amount = parseAmount(cells[cNet] ?? '');
		if (amount === null || amount === 0) {
			skipped++;
			continue;
		}

		const kind: Kind = amount > 0 ? 'income' : 'expense';
		const tag = kind === 'income' ? 'Other' : classifyExpense(notes, type);
		rows.push({
			kind,
			amountCents: Math.round(Math.abs(amount) * 100),
			tag,
			note: notes || null,
			occurredAt
		});
	}

	return { rows, scanned, skipped };
}
