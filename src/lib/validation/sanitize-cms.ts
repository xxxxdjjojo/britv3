import DOMPurify from "isomorphic-dompurify";

const CMS_ALLOWED_TAGS = [
  "p", "br", "b", "i", "strong", "em", "u", "s", "mark", "small", "sub", "sup",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li",
  "blockquote", "pre", "code", "hr", "div", "span",
  "img",
  "a",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td",
];

const CMS_ALLOWED_ATTR = [
  "href", "target", "rel",
  "src", "alt", "width", "height",
  "class",
  "colspan", "rowspan",
];

export function sanitizeCmsHtml(dirty: string): string {
  if (dirty == null) return "";
  if (typeof dirty !== "string") return "";

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: CMS_ALLOWED_TAGS,
    ALLOWED_ATTR: CMS_ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form", "input", "textarea", "select", "button"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur"],
  });
}
