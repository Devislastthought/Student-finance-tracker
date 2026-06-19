

import { loadRecords, loadSettings, saveRecords, saveSettings } from './storage.js';

const DEFAULT_CATEGORIES = ['Food', 'Books', 'Transport', 'Entertainment', 'Fees', 'Other'];
const DEFAULT_SETTINGS   = { budget: 0, eurRate: 0.92, gbpRate: 0.79, categories: DEFAULT_CATEGORIES };

let records  = loadRecords();
let settings = { ...DEFAULT_SETTINGS, ...loadSettings() };


export function getRecords()     { return records; }

export function addRecord(rec) {
  records.push(rec);
  saveRecords(records);
}

export function updateRecord(id, changes) {
  records = records.map(r => r.id === id ? { ...r, ...changes, updatedAt: new Date().toISOString() } : r);
  saveRecords(records);
}

export function deleteRecord(id) {
  records = records.filter(r => r.id !== id);
  saveRecords(records);
}

export function setRecords(newRecords) {
  records = newRecords;
  saveRecords(records);
}

export function getSettings()    { return settings; }

export function updateSettings(changes) {
  settings = { ...settings, ...changes };
  saveSettings(settings);
}

export function makeId() {
  const n = (records.length + 1).toString().padStart(4, '0');
  return `rec_${n}_${Date.now()}`;
}
