/**
 * String Extraction Utility
 * Helps identify and extract hardcoded strings for translation
 * Run: node scripts/extract-strings.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const workspaceRoot = process.cwd();

// Patterns to match hardcoded strings
const patterns = [
  // Match single and double quoted strings
  /["']([^"']+)["']/g,
  // Match template literals
  /`([^`]+)`/g,
];

// Extensions to scan
const extensions = [".jsx", ".js", ".tsx", ".ts"];

// Directories to scan (relative to src/)
const scanDirs = [
  "components",
  "pages",
  "lib",
  "hooks",
  "engines",
  "utils",
];

// Strings that are likely already handled or shouldn't be translated
const ignorePatterns = [
  /^\//, // URLs
  /^\./, // Relative imports
  /^@/, // Absolute imports
  /^http/, // URLs
  /^[A-Z][a-z]*[A-Z]/, // camelCase (likely variables)
  /^[0-9]+$/, // Numbers only
  /^[^a-zA-Z]*$/, // No letters
];

function shouldIgnore(str) {
  if (str.length < 3) return true; // Too short
  if (ignorePatterns.some((pattern) => pattern.test(str))) return true;
  return false;
}

function extractStringsFromFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const strings = new Set();

    // Remove comments and JSX tags
    const cleaned = content
      .replace(/\/\/.*$/gm, "") // Remove line comments
      .replace(/\/\*[\s\S]*?\*\//g, "") // Remove block comments
      .replace(/<[^>]*>/g, ""); // Remove JSX tags

    patterns.forEach((pattern) => {
      let match;
      const regex = new RegExp(pattern);
      while ((match = regex.exec(cleaned)) !== null) {
        const str = match[1];
        if (!shouldIgnore(str)) {
          strings.add(str);
        }
      }
    });

    return Array.from(strings);
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return [];
  }
}

function scanDirectory(dir) {
  const srcDir = path.join(workspaceRoot, "src", dir);
  const allStrings = new Map();

  if (!fs.existsSync(srcDir)) {
    console.warn(`Directory not found: ${srcDir}`);
    return allStrings;
  }

  function walk(directory) {
    const files = fs.readdirSync(directory);

    files.forEach((file) => {
      const filePath = path.join(directory, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        walk(filePath);
      } else if (extensions.includes(path.extname(filePath))) {
        const strings = extractStringsFromFile(filePath);
        strings.forEach((str) => {
          if (!allStrings.has(str)) {
            allStrings.set(str, []);
          }
          allStrings.get(str).push(path.relative(workspaceRoot, filePath));
        });
      }
    });
  }

  walk(srcDir);
  return allStrings;
}

export function generateStringExtractionReport() {
  console.log("🔍 Extracting translatable strings from ArthOS...\n");

  const allStrings = new Map();

  scanDirs.forEach((dir) => {
    const strings = scanDirectory(dir);
    strings.forEach((files, str) => {
      if (!allStrings.has(str)) {
        allStrings.set(str, []);
      }
      allStrings.get(str).push(...files);
    });
  });

  // Sort by frequency
  const sorted = Array.from(allStrings.entries()).sort(
    (a, b) => b[1].length - a[1].length
  );

  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    totalStrings: sorted.length,
    strings: sorted
      .slice(0, 100) // Top 100 strings
      .map(([str, files]) => ({
        string: str,
        occurrences: files.length,
        files: files.slice(0, 3), // First 3 files
      })),
  };

  // Save report
  const reportPath = path.join(workspaceRoot, ".extracted-strings.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`✅ Extraction complete!\n`);
  console.log(`📊 Found ${sorted.length} translatable strings`);
  console.log(`📄 Report saved to: .extracted-strings.json\n`);

  console.log("Top 20 strings by frequency:");
  console.log("─".repeat(80));
  sorted.slice(0, 20).forEach(([str, files], idx) => {
    console.log(
      `${(idx + 1).toString().padStart(2, "0")}. "${str}" (${files.length} occurrences)`
    );
  });
}

// CLI execution
const scriptUrl = pathToFileURL(process.argv[1]).href;
if (import.meta.url === scriptUrl) {
  generateStringExtractionReport();
}

export default {
  extractStringsFromFile,
  scanDirectory,
  generateStringExtractionReport,
};
