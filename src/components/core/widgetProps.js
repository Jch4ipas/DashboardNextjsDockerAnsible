/**
 * Derive a widget's props (with their default values) directly from its
 * component signature — so the backoffice can auto-create every prop key when a
 * widget is chosen, with NO separate schema to maintain.
 *
 * It parses the component's destructured props parameter, e.g.
 *   function W({ room, lang = "fr", count = 6 }) → { room: "", lang: "fr", count: 6 }
 * A prop with a default gets that value; a prop without one gets "" so the key
 * is still created for editing. Handles both the native form and the compiled
 * `let { ... } = e` form that bundlers emit, so it works in production too.
 * Non-literal defaults (objects, expressions) fall back to "".
 */

function parseDefault(expr) {
  const s = (expr || "").trim();
  if (s === "") return "";
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  if (s === "true") return true;
  if (s === "false") return false;
  const q = s[0];
  if ((q === '"' || q === "'" || q === "`") && s[s.length - 1] === q) {
    return s.slice(1, -1);
  }
  return "";
}

/** Split on top-level commas, ignoring nested (), {}, [] and strings. */
function splitTopLevel(str) {
  const parts = [];
  let depth = 0;
  let quote = null;
  let cur = "";
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (quote) {
      cur += c;
      if (c === quote && str[i - 1] !== "\\") quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") { quote = c; cur += c; continue; }
    if (c === "(" || c === "{" || c === "[") depth++;
    if (c === ")" || c === "}" || c === "]") depth--;
    if (c === "," && depth === 0) { parts.push(cur); cur = ""; continue; }
    cur += c;
  }
  if (cur.trim()) parts.push(cur);
  return parts;
}

/** Balanced {...} content starting at/after `from`, or null. */
function braceGroup(src, from) {
  const start = src.indexOf("{", from);
  if (start === -1) return null;
  let depth = 0;
  let quote = null;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (quote) { if (c === quote && src[i - 1] !== "\\") quote = null; continue; }
    if (c === '"' || c === "'" || c === "`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}") { depth--; if (depth === 0) return src.slice(start + 1, i); }
  }
  return null;
}

/** Parse the inside of a props destructuring into { name: defaultOrEmpty }. */
function parseDestructure(body) {
  const props = {};
  for (const raw of splitTopLevel(body)) {
    const part = raw.trim();
    if (!part || part.startsWith("...")) continue; // skip rest element
    const colon = part.indexOf(":");
    const eq = part.indexOf("=");
    let keyEnd = part.length;
    if (colon !== -1) keyEnd = Math.min(keyEnd, colon);
    if (eq !== -1) keyEnd = Math.min(keyEnd, eq);
    const key = part.slice(0, keyEnd).trim();
    if (!key) continue;
    props[key] = eq !== -1 ? parseDefault(part.slice(eq + 1)) : "";
  }
  return props;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * @param {Function} component
 * @returns {Record<string, unknown>} props with default values (or "" if none)
 */
export function extractWidgetProps(component) {
  if (typeof component !== "function") return {};
  let src;
  try {
    src = component.toString();
  } catch {
    return {};
  }

  // Isolate the parameter list: between the first "(" and its matching ")".
  const open = src.indexOf("(");
  if (open === -1) return {};
  let depth = 0;
  let quote = null;
  let close = -1;
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (quote) { if (c === quote && src[i - 1] !== "\\") quote = null; continue; }
    if (c === '"' || c === "'" || c === "`") { quote = c; continue; }
    if (c === "(") depth++;
    else if (c === ")") { depth--; if (depth === 0) { close = i; break; } }
  }
  if (close === -1) return {};
  const params = src.slice(open + 1, close).trim();

  // Native form: the first parameter is a destructuring pattern.
  if (params.startsWith("{")) {
    const body = braceGroup(params, 0);
    return body == null ? {} : parseDestructure(body);
  }

  // Compiled form: `function (e) { let { ... } = e; ... }`.
  if (/^[A-Za-z_$][\w$]*$/.test(params)) {
    const re = new RegExp("\\}\\s*=\\s*" + escapeRegExp(params) + "(?![\\w$])");
    const m = re.exec(src);
    if (m) {
      const end = src.lastIndexOf("}", m.index);
      let d = 0;
      for (let i = end; i >= 0; i--) {
        if (src[i] === "}") d++;
        else if (src[i] === "{") {
          d--;
          if (d === 0) return parseDestructure(src.slice(i + 1, end));
        }
      }
    }
  }

  return {};
}
