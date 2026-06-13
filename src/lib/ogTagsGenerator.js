/**
 * OG Tags Generator
 *
 * Generates Open Graph tags for social media preview optimization
 * When a roast is shared on WhatsApp, Twitter, etc., these tags determine
 * the preview card that appears (title, description, image)
 */

export function generateOGTags(payload) {
  const { score, personality } = payload;

  // Extract metadata from payload
  const emoji = score >= 75 ? "🚀" : score >= 50 ? "⚡" : "🔥";
  const sentiment = score >= 75 ? "Crushing It" : score >= 50 ? "Getting By" : "In Trouble";

  const title = `My Financial Roast: ${emoji} Score ${score}/100 (${personality})`;
  const description = `I just discovered my financial personality is ${personality}. My health score: ${score}/100. The roast? Brutal. Accurate. Eye-opening. What's yours?`;
  const keywords = [
    "financial-health",
    "money-management",
    "financial-personality",
    "roast",
    personality.toLowerCase()
  ].join(",");

  // Generate a data URL image (simple colored card with text)
  // In production, this could be a dynamic image service
  const imageUrl = generateSocialImage(score, personality);

  return {
    // Basic tags
    title,
    description,
    keywords,

    // Open Graph tags (Facebook, LinkedIn, WhatsApp preview)
    "og:title": title,
    "og:description": description,
    "og:type": "website",
    "og:image": imageUrl,
    "og:image:width": "1200",
    "og:image:height": "630",
    "og:locale": "en_US",

    // Twitter card tags
    "twitter:card": "summary_large_image",
    "twitter:title": title,
    "twitter:description": description,
    "twitter:image": imageUrl,

    // Additional meta tags
    "theme-color": getThemeColor(score),
    "color-scheme": "dark"
  };
}

/**
 * Inject OG tags into the document head
 * Call this in the RoastViewPage useEffect
 */
export function injectOGTags(payload) {
  const tags = generateOGTags(payload);

  Object.entries(tags).forEach(([key, value]) => {
    if (key === "title") {
      document.title = value;
    } else {
      const metaTag = document.querySelector(`meta[property="${key}"], meta[name="${key}"]`);
      const tagName = key.startsWith("og:") || key.startsWith("twitter:") ? "property" : "name";

      if (metaTag) {
        metaTag.setAttribute("content", value);
      } else {
        const newMeta = document.createElement("meta");
        newMeta.setAttribute(tagName, key);
        newMeta.setAttribute("content", value);
        document.head.appendChild(newMeta);
      }
    }
  });

  // Also set canonical URL
  const canonicalUrl = window.location.href;
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.appendChild(canonical);
  }
  canonical.href = canonicalUrl;
}

/**
 * Generate a simple data URL image for social preview
 * This is a fallback; in production, use a dedicated image service
 */
function generateSocialImage(score, personality) {
  // For MVP, return a placeholder URL
  // In production, would call an image generation service
  // e.g., `https://og-image-service.com/roast/${score}/${personality}`

  // For now, return a gradient-based data URL
  const emoji = score >= 75 ? "🚀" : score >= 50 ? "⚡" : "🔥";
  const bgColor =
    score >= 75
      ? "from-green-600 to-emerald-600"
      : score >= 50
        ? "from-yellow-600 to-orange-600"
        : "from-red-600 to-orange-600";

  // Return a simple gradient card representation
  // This would be replaced by actual image generation in production
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='630'%3E%3Crect fill='%23050713' width='1200' height='630'/%3E%3Ctext x='600' y='315' font-size='96' font-weight='bold' text-anchor='middle' fill='white' font-family='Arial'%3E${emoji}${score}${emoji}%3C/text%3E%3Ctext x='600' y='420' font-size='48' text-anchor='middle' fill='%23ff9100' font-family='Arial'%3E${personality} | Financial Roast%3C/text%3E%3C/svg%3E`;
}

/**
 * Get theme color based on score
 */
function getThemeColor(score) {
  if (score >= 75) {
    return "#10b981";
  } // emerald
  if (score >= 50) {
    return "#f59e0b";
  } // amber
  return "#ef4444"; // red
}

/**
 * Generate a complete HTML preview for debugging/testing
 */
export function generateHTMLPreview(payload) {
  const tags = generateOGTags(payload);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${tags.title}</title>
  <meta name="description" content="${tags.description}">
  <meta property="og:title" content="${tags["og:title"]}">
  <meta property="og:description" content="${tags["og:description"]}">
  <meta property="og:type" content="website">
  <meta property="og:image" content="${tags["og:image"]}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${tags["twitter:title"]}">
  <meta name="twitter:description" content="${tags["twitter:description"]}">
  <meta name="twitter:image" content="${tags["twitter:image"]}">
  <meta name="theme-color" content="${tags["theme-color"]}">
  <link rel="canonical" href="${window.location.href}">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #050713 0%, #1a1a2e 50%, #0f3460 100%);
      color: white;
      padding: 2rem;
      margin: 0;
    }
    .preview-card {
      max-width: 600px;
      margin: 2rem auto;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 2rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .preview-title {
      font-size: 1.8rem;
      margin-bottom: 1rem;
      color: #ff9100;
    }
    .preview-desc {
      font-size: 1rem;
      line-height: 1.6;
      opacity: 0.9;
    }
  </style>
</head>
<body>
  <div class="preview-card">
    <h1 class="preview-title">${tags.title}</h1>
    <p class="preview-desc">${tags.description}</p>
  </div>
</body>
</html>
  `;
}
