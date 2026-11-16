import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { CSVParseResult } from '../types';
import { EMAIL_RFC5322_REGEX } from './template';

export async function parseFile(file: File): Promise<CSVParseResult> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'xlsx' || extension === 'xls') {
    return parseExcelFile(file);
  } else {
    return parseCsvFile(file);
  }
}

function parseCsvFile(file: File): Promise<CSVParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        try {
          const rawRows = results.data as Record<string, string>[];
          const headers = results.meta.fields || (rawRows[0] ? Object.keys(rawRows[0]) : []);
          const processed = processRawRows(headers, rawRows);
          resolve(processed);
        } catch (err) {
          reject(err);
        }
      },
      error: (err) => reject(err)
    });
  });
}

async function parseExcelFile(file: File): Promise<CSVParseResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const headers = rawRows[0] ? Object.keys(rawRows[0]) : [];
  return processRawRows(headers, rawRows);
}

function processRawRows(headers: string[], rows: Record<string, any>[]): CSVParseResult {
  const cleanHeaders = headers.map(h => h.trim()).filter(Boolean);
  
  // Detect mapping
  const detectedMapping: CSVParseResult['detectedMapping'] = {
    email: ''
  };

  for (const h of cleanHeaders) {
    const lower = h.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!detectedMapping.email && (lower === 'email' || lower === 'emailaddress' || lower === 'recipient' || lower === 'mail')) {
      detectedMapping.email = h;
    } else if (!detectedMapping.first_name && (lower === 'firstname' || lower === 'first' || lower === 'givenname')) {
      detectedMapping.first_name = h;
    } else if (!detectedMapping.last_name && (lower === 'lastname' || lower === 'last' || lower === 'surname')) {
      detectedMapping.last_name = h;
    } else if (!detectedMapping.company && (lower === 'company' || lower === 'companyname' || lower === 'org' || lower === 'organization')) {
      detectedMapping.company = h;
    }
  }

  // If email column wasn't detected by header name, try to find column with @ entries
  if (!detectedMapping.email && rows.length > 0) {
    for (const h of cleanHeaders) {
      const sampleVal = String(rows[0][h] || '');
      if (sampleVal.includes('@')) {
        detectedMapping.email = h;
        break;
      }
    }
  }

  const seenEmails = new Set<string>();
  let validCount = 0;
  let invalidCount = 0;
  let duplicateCount = 0;

  const emailKey = detectedMapping.email;

  const previewData: Record<string, string>[] = [];

  for (const row of rows) {
    const rawEmail = emailKey ? String(row[emailKey] || '').trim().toLowerCase() : '';
    
    // Check syntax
    const isValid = EMAIL_RFC5322_REGEX.test(rawEmail);
    const isDuplicate = seenEmails.has(rawEmail);

    if (!isValid) {
      invalidCount++;
    } else if (isDuplicate) {
      duplicateCount++;
    } else {
      validCount++;
      seenEmails.add(rawEmail);
    }

    if (previewData.length < 8) {
      const stringifiedRow: Record<string, string> = {};
      for (const [k, v] of Object.entries(row)) {
        stringifiedRow[k] = String(v ?? '');
      }
      previewData.push(stringifiedRow);
    }
  }

  return {
    headers: cleanHeaders,
    rows: rows.map(r => {
      const cleanRow: Record<string, string> = {};
      for (const [k, v] of Object.entries(r)) {
        cleanRow[k] = String(v ?? '').trim();
      }
      return cleanRow;
    }),
    totalRows: rows.length,
    validRows: validCount,
    invalidRows: invalidCount,
    duplicateRows: duplicateCount,
    previewData,
    detectedMapping
  };
}
