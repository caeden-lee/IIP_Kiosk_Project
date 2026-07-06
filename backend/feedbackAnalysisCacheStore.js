const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const db = require('./db');

const CACHE_SCHEMA_VERSION = 1;
const CACHE_DIR = path.join(__dirname, 'cache');
const CACHE_FILE = path.join(CACHE_DIR, 'feedback-analysis-cache.json');
const CACHE_SETTINGS_FILE = path.join(CACHE_DIR, 'feedback-analysis-cache.json');
const CACHE_TABLE = 'feedback_analysis_cache';

const MODE_MODEL_NAMES = {
    'rule-based': 'rule-based',
    xenova: 'Xenova/bert-base-multilingual-uncased-sentiment',
    localgpt: 'phi3',
    qwen: 'qwen2.5:3b',
    gemma: 'gemma2:2b'
};

const cacheMap = new Map();
let readyPromise = null;
let storageMode = 'both';

function mysqlDate(date = new Date()) {
    return date
        .toISOString()
        .slice(0, 19)
        .replace('T', ' ');
}

function ensureCacheDir() {
    if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
}

function ensureSettingsDir() {
    const settingsDir = path.dirname(CACHE_SETTINGS_FILE);
    if (!fs.existsSync(settingsDir)) {
        fs.mkdirSync(settingsDir, { recursive: true });
    }
}

function normalizeStorageMode(value) {
    const mode = String(value || '').trim().toLowerCase();
    if (mode === 'json' || mode === 'database' || mode === 'both') {
        return mode;
    }
    return 'both';
}

function readStorageMode() {
    try {
        if (!fs.existsSync(CACHE_SETTINGS_FILE)) {
            return 'both';
        }

        const raw = fs.readFileSync(CACHE_SETTINGS_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        return normalizeStorageMode(parsed.storageMode);
    } catch (error) {
        console.warn('⚠️ Feedback analysis cache settings load skipped:', error.message);
        return 'both';
    }
}

function writeStorageMode(mode) {
    try {
        ensureSettingsDir();
        const payload = {
            storageMode: normalizeStorageMode(mode),
            updatedAt: new Date().toISOString()
        };

        fs.writeFileSync(CACHE_SETTINGS_FILE, JSON.stringify(payload, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('❌ Failed to save feedback analysis cache settings:', error.message);
        return false;
    }
}

function normalizeAnalysisText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function getModelName(mode) {
    return MODE_MODEL_NAMES[mode] || mode || 'unknown';
}

function buildCacheKey(mode, modelName, text) {
    const normalizedText = normalizeAnalysisText(text);
    return crypto
        .createHash('sha256')
        .update([CACHE_SCHEMA_VERSION, mode || '', modelName || '', normalizedText].join('|'))
        .digest('hex');
}

function createCacheEntry({ mode, modelName, text, sentiment, hitCount = 1, analyzedAt = mysqlDate(), lastUsedAt = mysqlDate() }) {
    const normalizedText = normalizeAnalysisText(text);
    const cacheKey = buildCacheKey(mode, modelName, normalizedText);

    return {
        cacheKey,
        mode,
        modelName,
        normalizedText,
        sourceText: String(text || '').trim(),
        sentiment,
        hitCount,
        analyzedAt,
        lastUsedAt
    };
}

function upsertCacheEntry(entry) {
    if (!entry || !entry.cacheKey) {
        return null;
    }

    const existing = cacheMap.get(entry.cacheKey);
    const merged = {
        ...existing,
        ...entry,
        hitCount: Number(entry.hitCount ?? existing?.hitCount ?? 1) || 1,
        analyzedAt: entry.analyzedAt || existing?.analyzedAt || mysqlDate(),
        lastUsedAt: entry.lastUsedAt || existing?.lastUsedAt || mysqlDate()
    };

    cacheMap.set(entry.cacheKey, merged);
    return merged;
}

function hydrateFromFile() {
    ensureCacheDir();

    if (!fs.existsSync(CACHE_FILE)) {
        return;
    }

    try {
        const parsed = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
        const entries = Array.isArray(parsed.entries)
            ? parsed.entries
            : Object.values(parsed.entries || {});

        entries.forEach(entry => upsertCacheEntry(entry));
        console.log(`✅ Loaded ${cacheMap.size} feedback analysis cache entr${cacheMap.size === 1 ? 'y' : 'ies'} from file`);
    } catch (error) {
        console.error('❌ Failed to read feedback analysis cache file:', error.message);
    }
}

async function hydrateFromDatabase() {
    try {
        const [rows] = await db.pool.promise().query(
            `SELECT cache_key, analysis_mode, model_name, normalized_text, source_text, sentiment, hit_count, analyzed_at, last_used_at
             FROM ${CACHE_TABLE}
             ORDER BY last_used_at DESC, analyzed_at DESC`
        );

        (rows || []).forEach(row => {
            upsertCacheEntry({
                cacheKey: row.cache_key,
                mode: row.analysis_mode,
                modelName: row.model_name,
                normalizedText: row.normalized_text,
                sourceText: row.source_text,
                sentiment: row.sentiment,
                hitCount: row.hit_count,
                analyzedAt: row.analyzed_at,
                lastUsedAt: row.last_used_at
            });
        });

        console.log(`✅ Loaded feedback analysis cache from database (${rows.length} row${rows.length === 1 ? '' : 's'})`);
    } catch (error) {
        console.warn('⚠️ Feedback analysis cache database load skipped:', error.message);
    }
}

async function ensureCacheTable() {
    await db.pool.promise().query(
        `CREATE TABLE IF NOT EXISTS ${CACHE_TABLE} (
            cache_key VARCHAR(255) PRIMARY KEY,
            analysis_mode VARCHAR(50) NOT NULL,
            model_name VARCHAR(100) NOT NULL,
            normalized_text TEXT NOT NULL,
            source_text TEXT NOT NULL,
            sentiment ENUM('positive', 'neutral', 'negative') NOT NULL,
            hit_count INT NOT NULL DEFAULT 1,
            analyzed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            last_used_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_analysis_mode (analysis_mode),
            INDEX idx_model_name (model_name),
            INDEX idx_last_used_at (last_used_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    );
}

async function saveEntryToDatabase(entry) {
    if (!entry) return;

    try {
        const sql = `
            INSERT INTO ${CACHE_TABLE}
            (
                cache_key,
                analysis_mode,
                model_name,
                normalized_text,
                source_text,
                sentiment,
                hit_count,
                analyzed_at,
                last_used_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ON DUPLICATE KEY UPDATE
                sentiment = VALUES(sentiment),
                hit_count = hit_count + 1,
                last_used_at = NOW()
        `;

        await db.pool.promise().execute(sql, [
            entry.cacheKey,
            entry.mode,
            entry.modelName,
            entry.normalizedText,
            entry.sourceText,
            entry.sentiment,
            entry.hitCount
        ]);

    } catch (err) {
        console.error('❌ Failed to save cache entry to database:', err.message);
    }
}

async function ensureReady() {
    if (!readyPromise) {
        readyPromise = (async () => {
            storageMode = readStorageMode();

            try {
                if (storageMode === 'database' || storageMode === 'both') {
                    await ensureCacheTable();
                }
            } catch (error) {
                console.warn('⚠️ Feedback analysis cache table could not be ensured:', error.message);
            }

            if (storageMode === 'json' || storageMode === 'both') {
                hydrateFromFile();
            }

            if (storageMode === 'database' || storageMode === 'both') {
                await hydrateFromDatabase();
            }
            return true;
        })();
    }

    return readyPromise;
}

async function getMany(mode, modelName, texts) {
    await ensureReady();

    const lookup = new Map();
    const resolvedModelName = modelName || getModelName(mode);

    (texts || []).forEach(text => {
        const normalizedText = normalizeAnalysisText(text);
        if (!normalizedText) {
            return;
        }

        const cacheKey = buildCacheKey(mode, resolvedModelName, normalizedText);
        const entry = cacheMap.get(cacheKey);
        if (entry) {
            lookup.set(normalizedText, entry);
        }
    });

    return lookup;
}

async function saveMany(entries) {
    await ensureReady();

    const preparedEntries = [];
    const seenKeys = new Set();

    (entries || []).forEach(entry => {
        const mode = entry?.mode || 'unknown';
        const modelName = entry?.modelName || getModelName(mode);
        const normalizedText = normalizeAnalysisText(entry?.text);

        if (!normalizedText) {
            return;
        }

        const cacheEntry = createCacheEntry({
            mode,
            modelName,
            text: entry.text,
            sentiment: entry.sentiment || 'neutral'
        });

        if (seenKeys.has(cacheEntry.cacheKey)) {
            return;
        }

        seenKeys.add(cacheEntry.cacheKey);
        preparedEntries.push(cacheEntry);
        upsertCacheEntry(cacheEntry);
    });

    if (preparedEntries.length === 0) {
        return;
    }

    if (storageMode === 'json' || storageMode === 'both') {
        ensureCacheDir();

        const filePayload = {
            version: CACHE_SCHEMA_VERSION,
            updatedAt: new Date().toISOString(),
            entries: Object.fromEntries(cacheMap.entries())
        };

        fs.writeFileSync(CACHE_FILE, JSON.stringify(filePayload, null, 2), 'utf8');
    }

    if (storageMode === 'database' || storageMode === 'both') {
        try {
            const sql = `
                INSERT INTO ${CACHE_TABLE}
                    (cache_key, analysis_mode, model_name, normalized_text, source_text, sentiment, hit_count, analyzed_at, last_used_at)
                VALUES ?
                ON DUPLICATE KEY UPDATE
                    analysis_mode = VALUES(analysis_mode),
                    model_name = VALUES(model_name),
                    normalized_text = VALUES(normalized_text),
                    source_text = VALUES(source_text),
                    sentiment = VALUES(sentiment),
                    hit_count = VALUES(hit_count),
                    analyzed_at = VALUES(analyzed_at),
                    last_used_at = VALUES(last_used_at)
            `;

            const values = preparedEntries.map(entry => [
                entry.cacheKey,
                entry.mode,
                entry.modelName,
                entry.normalizedText,
                entry.sourceText,
                entry.sentiment,
                entry.hitCount,
                entry.analyzedAt,
                entry.lastUsedAt
            ]);

            await db.pool.promise().query(sql, [values]);
        } catch (error) {
            console.warn('⚠️ Feedback analysis cache database write skipped:', error.message);
        }
    }
}

function getStorageMode() {
    return storageMode;
}

function setStorageMode(mode) {
    const normalized = normalizeStorageMode(mode);
    const persisted = writeStorageMode(normalized);
    if (persisted) {
        storageMode = normalized;
        readyPromise = null;
    }
    return persisted ? storageMode : null;
}

async function reloadCache() {
    cacheMap.clear();
    readyPromise = null;
    await ensureReady();
    return storageMode;
}

module.exports = {
    ensureReady,
    getMany,
    saveMany,
    normalizeAnalysisText,
    getModelName,
    buildCacheKey,
    getStorageMode,
    setStorageMode,
    reloadCache,
    normalizeStorageMode
};
