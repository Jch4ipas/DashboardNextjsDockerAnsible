/**
 * Small pictogram for an EPFL menu food type (recipe.category).
 *
 * Icons are self-contained inline SVGs (lucide paths, MIT) so there is no
 * runtime dependency; swap in official EPFL styleguide SVGs here if needed.
 * Unknown / "unclassified" categories render nothing.
 */
const LEAF = (
  <>
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </>
);
const BEEF = (
  <>
    <circle cx="12.5" cy="8.5" r="2.5" />
    <path d="M12.5 2a6.5 6.5 0 0 0-6.22 4.6c-1.1 3.13-.78 3.9-3.18 6.08A3 3 0 0 0 5 18c4 0 8.4-1.8 11.4-4.3A6.5 6.5 0 0 0 12.5 2Z" />
    <path d="m18.5 6 2.19 4.5a6.48 6.48 0 0 1 .31 2 6.49 6.49 0 0 1-2.6 5.2C15.4 20.2 11 22 7 22a3 3 0 0 1-2.68-1.66L2.4 16.5" />
  </>
);
const FISH = (
  <>
    <path d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.47-3.44 6-7 6s-7.56-2.53-8.5-6Z" />
    <path d="M18 12v.5" />
    <path d="M16 17.93a9.77 9.77 0 0 1 0-11.86" />
    <path d="M7 10.67C7 8 5.58 5.97 2.73 5.5c-1 1.5-1 5 .23 6.5-1.24 1.5-1.24 5-.23 6.5C5.58 18.03 7 16 7 13.33" />
    <path d="M10.46 7.26C10.2 5.88 9.17 4.24 8 3h5.8a2 2 0 0 1 1.98 1.67l.23 1.4" />
    <path d="m16.01 17.93-.23 1.4A2 2 0 0 1 13.8 21H9.5a5.96 5.96 0 0 0 1.49-3.98" />
  </>
);
const DRUMSTICK = (
  <>
    <path d="M15.45 15.4c-2.13.65-4.3.32-5.7-1.1-2.29-2.27-1.76-6.5 1.17-9.42 2.93-2.93 7.15-3.46 9.43-1.18 1.41 1.41 1.74 3.57 1.1 5.71-1.4-.51-3.26-.02-4.64 1.36-1.38 1.38-1.87 3.23-1.36 4.63z" />
    <path d="m11.25 15.6-2.16 2.16a2.5 2.5 0 1 1-4.56 1.73 2.49 2.49 0 0 1-1.41-4.24 2.5 2.5 0 0 1 3.14-.32l2.16-2.16" />
  </>
);
const SALAD = (
  <>
    <path d="M7 21h10" />
    <path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z" />
    <path d="M11.38 12a2.4 2.4 0 0 1-.4-4.77 2.4 2.4 0 0 1 3.2-2.77 2.4 2.4 0 0 1 3.47-.63 2.4 2.4 0 0 1 3.37 3.37 2.4 2.4 0 0 1-1.1 3.7" />
    <path d="m13 12 4-2" />
    <path d="M10.9 7.25A3.99 3.99 0 0 0 4 10c0 .73.2 1.41.54 2" />
  </>
);
const COOKIE = (
  <>
    <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
    <path d="M8.5 8.5v.01" />
    <path d="M16 15.5v.01" />
    <path d="M12 12v.01" />
    <path d="M11 17v.01" />
    <path d="M7 14v.01" />
  </>
);

const ICONS = {
  vegetarian: { color: "#3FA535", label: "Végétarien", paths: LEAF },
  vegan: { color: "#3FA535", label: "Vegan", paths: LEAF },
  meat: { color: "#C0392B", label: "Viande", paths: BEEF },
  fish: { color: "#2E7FBF", label: "Poisson", paths: FISH },
  poultry: { color: "#C97B2F", label: "Volaille", paths: DRUMSTICK },
  sidedish: { color: "#7CB342", label: "Accompagnement", paths: SALAD },
  snack: { color: "#B08050", label: "Snack", paths: COOKIE },
};

/**
 * @param {{ category?: string|null, className?: string }} props
 */
export default function FoodTypeIcon({ category, className = "w-4 h-4" }) {
  if (!category) return null;
  const icon = ICONS[String(category).toLowerCase()];
  if (!icon) return null; // unclassified / unknown → nothing

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${className} shrink-0`}
      style={{ color: icon.color }}
      role="img"
      aria-label={icon.label}
    >
      <title>{icon.label}</title>
      {icon.paths}
    </svg>
  );
}
