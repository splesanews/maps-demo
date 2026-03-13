# The Times Design System Style Guide

## 1. Core Typography Foundations
### Font Families
- **Brand/Heading:** `Times Modern` (Serif) - Used for primary editorial impact.
- **Editorial Body:** `Times Digital W04` (Serif) - Used for long-form article content.
- **Utility/UI:** `Times Roboto` (Sans-Serif) - Used for functional UI, labels, buttons, and metadata.

### Font Weights
| Weight | Value | Availability |
| :--- | :--- | :--- |
| **Light** | 300 | Times Modern |
| **Regular** | 400 | All Families |
| **Medium** | 500 | Times Digital, Times Roboto |
| **Bold** | 700 | All Families |
| **Extra Bold**| 800 | Times Modern |
| **Black** | 900 | Times Modern |

---

## 2. Responsive Type Scale
*Values: Font-size (px) / Line-height (%)*

### Brand (Editorial) Scale
| Token | Small (0-767) | Medium (768-1023) | Large (1024-1439) | XLarge (1440+) |
| :--- | :--- | :--- | :--- | :--- |
| `brand.heading.2xlarge` | 36 / 112.5 | 40 / 112.5 | 46 / 112.5 | 56 / 112.5 |
| `brand.heading.xlarge` | 34 / 112.5 | 36 / 112.5 | 40 / 112.5 | 46 / 112.5 |
| `brand.heading.large` | 32 / 112.5 | 32 / 112.5 | 32 / 112.5 | 36 / 112.5 |
| `brand.paragraph.medium`| 17 / 150 | 20 / 150 | 20 / 150 | 20 / 150 |
| `brand.standfirst.large`| 22 / 112.5 | 24 / 112.5 | 24 / 112.5 | 24 / 112.5 |

### Utility (UI) Scale
| Token | Small | Medium | Large | XLarge |
| :--- | :--- | :--- | :--- | :--- |
| `utility.heading.large` | 28 / 125 | 28 / 125 | 32 / 112.5 | 40 / 112.5 |
| `utility.body.medium` | 16 / 150 | 16 / 150 | 16 / 150 | 16 / 150 |
| `utility.button.medium` | 16 / 100 | 16 / 100 | 16 / 100 | 16 / 100 |
| `utility.label.small` | 14 / 112.5 | 14 / 112.5 | 14 / 112.5 | 14 / 112.5 |

---

## 3. Semantic Colour System
*Use these tokens instead of raw hex codes to ensure Dark Mode compatibility.*

### Surface Tokens
- `surface-primary`: Main page background.
- `surface-secondary`: Card backgrounds, section groupings.
- `surface-tertiary`: Inset UI elements.
- `surface-brand`: Core brand-colored background.

### Text & Icon Tokens
- `text-primary`: Standard high-contrast text.
- `text-secondary`: Supporting labels and captions.
- `text-tertiary`: Disabled or placeholder text.
- `text-brand`: Headings or accents in brand color.

### Interactive & Feedback
- **Actionable:** `interactive-primary-default`, `-hover`, `-pressed`.
- **Status:** `feedback-error` (Red), `feedback-warning` (Amber), `feedback-success` (Green), `feedback-info` (Blue).

---

## 4. Component Implementation Rules

### Buttons
- **Font:** `Times Roboto`
- **Weight:** `Bold` (700)
- **Line Height:** Strictly `100%` to ensure perfect vertical alignment.
- **Tokens:** Use `utility.button.[size]` tokens.

### Links
- **Font:** `Times Roboto`
- **Decoration:** `underline` by default for body links.
- **Weight:** `Medium` (500) or `Regular` (400).

### Inputs
- **Border:** Use `border-primary` for default, `border-focus` for active state.
- **Label:** Use `utility.label.small` (Roboto, Medium).

---

## 🤖 AI Instructions for Cursor
1. **Apply Responsive Scale:** When generating components, look up the `Token` in the tables above and apply the correct `font-size` and `line-height` based on the screen width.
2. **Semantic Variables:** Always use CSS variables (e.g., `var(--text-primary)`) or Tailwind theme extensions that map to these semantic names. Do not use hardcoded hex values.
3. **Hierarchy:** - Use **Times Modern** for editorial headlines and titles.
   - Use **Times Digital** for paragraph body text.
   - Use **Times Roboto** for everything else (UI, buttons, forms).
4. **Spacing:** Maintain the vertical rhythm defined by the `line-height` percentages (112.5% for headings, 150% for body).