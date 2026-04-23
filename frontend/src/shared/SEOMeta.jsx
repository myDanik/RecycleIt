import { useEffect } from "react";

const BASE_URL = "https://recycle-it.ru";

const DEFAULTS = {
  title: "Карта пунктов приёма вторсырья",
  description:
    "Найдите ближайший пункт приёма вторсырья: пластик, стекло, макулатура, металл.",
  image: `${BASE_URL}/default.jpg`,
};

function getOrCreateMeta(attrName, attrValue) {
  let el = document.querySelector(`meta[${attrName}="${attrValue}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  return el;
}

function getOrCreateLink(rel) {
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  return el;
}

export default function SEOMeta({
  title,
  description,
  image,
  canonicalPath,
}) {
  const fullTitle = title
    ? `${title} — Карта вторсырья`
    : DEFAULTS.title;
  const fullDescription = description || DEFAULTS.description;
  const fullImage = image || DEFAULTS.image;

  const canonicalUrl = `${BASE_URL}${canonicalPath ?? window.location.pathname}`;

  useEffect(() => {
    const prevTitle = document.title;
    document.title = fullTitle;

    const descMeta = getOrCreateMeta("name", "description");
    const prevDesc = descMeta.getAttribute("content");
    descMeta.setAttribute("content", fullDescription);

    const canonLink = getOrCreateLink("canonical");
    const prevCanonical = canonLink.getAttribute("href");
    canonLink.setAttribute("href", canonicalUrl);

    const ogTags = {
      "og:type": "website",
      "og:site_name": "Карта вторсырья",
      "og:title": fullTitle,
      "og:description": fullDescription,
      "og:url": canonicalUrl,
      "og:image": fullImage,
      "og:locale": "ru_RU",
    };

    const prevOg = {};
    for (const [property, content] of Object.entries(ogTags)) {
      const meta = getOrCreateMeta("property", property);
      prevOg[property] = meta.getAttribute("content");
      meta.setAttribute("content", content);
    }

    return () => {
      document.title = prevTitle;
      descMeta.setAttribute("content", prevDesc ?? "");
      canonLink.setAttribute("href", prevCanonical ?? "");
      for (const [property, prevContent] of Object.entries(prevOg)) {
        getOrCreateMeta("property", property).setAttribute(
          "content",
          prevContent ?? ""
        );
      }
    };
  }, [fullTitle, fullDescription, fullImage, canonicalUrl]);

  return null;
}