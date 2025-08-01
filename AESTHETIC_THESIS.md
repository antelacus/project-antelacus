# Aesthetic Thesis: Living Manuscript (活手稿)

This document codifies the aesthetic philosophy for the antelacus.com digital identity. It serves as the single source of truth for all design and development decisions, ensuring a cohesive, unique, and timeless user experience.

---

## 一、Aesthetic Thesis (美学主张)

The core philosophy is the **Living Manuscript (活手稿)**.

This is not about making a website that *looks like* a manuscript. It is about embodying the *spirit* of one. A living manuscript is a space where thought takes form. It is structured, yet alive. It is personal, yet clear. It is the perfect marriage of the project's core dualities: tranquility and dynamism, broad vision and resolute action.

This philosophy is built upon three core principles:

### （一）Principle of the Deliberate Mark (深思熟虑的笔触)

*   **Philosophy:** Every element—every line, every letter, every space—is a deliberate mark. There is no decoration, only essential communication. We question the existence of every line and shadow. We treat whitespace not as emptiness, but as a moment of quiet contemplation.
*   **In Practice:** Reject pre-packaged components in spirit. Prioritize profound intention over ornamentation. *Slow is steady, and steady is fast.*

### （二）Principle of Cultivated Growth (有机生长的肌理)

*   **Philosophy:** The aesthetic must feel like a living organism, a garden that is cultivated. It should show evidence of life and the passage of time. It embraces the idea of "no best, only better."
*   **In Practice:** This manifests as subtle textures, organic animations, and layouts that feel composed and human, not mechanically generated. It allows for the controlled imperfections that make a work feel authentic.

### （三）Principle of the Quiet Reveal (静默展开的层次)

*   **Philosophy:** The aesthetic is not about shouting for attention; it is about inviting discovery. It reveals its secrets slowly, rewarding the patient observer.
*   **In Practice:** This translates to a subtle interactive language. Hovering reveals new layers of information. Transitions feel like turning a page. The user is a reader, a confidant invited to explore.

---

## 二、The Sensory Universe (感官宇宙)

This is the tangible manifestation of the Living Manuscript philosophy.

### （一）色彩与光影 (Color & Light): The Soul of the Paper

We create an environment, not a theme.

*   **Core Palette:**
    *   **纸 (Paper) - The Canvas:** `#F9F8F6` (Warm, sunlit rice paper)
    *   **墨 (Ink) - The Mark:** `#1E1E1D` (Dried Sumi ink)
    *   **朱砂 (Seal) - The Signature:** `#B42A1E` (Artist's seal paste). Used with extreme restraint for primary interactive moments.

*   **Supporting Tones (Washes):**
    *   **苔 (Moss Wash):** `#EFF1ED` (For content related to growth, ideas)
    *   **石 (Stone Wash):** `#EAEAEA` (For structure, projects, stability)

*   **Light:**
    *   Soft, diffuse light. No artificial drop-shadows. Depth is created through layering `Wash` tones.

### （二）字体 (Typography): The Form of Thought

A pairing that feels both classic and alive.

*   **Latin:**
    *   **Headings:** **Cormorant Garamond** (Classical, elegant, refined serif with graceful proportions)
    *   **Body:** **Source Serif 4** (Readable, elegant, warm)

*   **Chinese:**
    *   **Headings & Body:** **Source Han Serif (思源宋体)** (Connects to woodblock printing legacy)

*   **Code:**
    *   **JetBrains Mono** (Clean, legible)

### （三）空间与布局 (Space & Layout): The Rhythm of Contemplation

Whitespace is our most active tool.

*   **Immersive Reading:** A single, elegant column for long-form content. Generous margins to eliminate distraction.
*   **Organic Grid:** Asymmetric, composed grid for index pages, guided by balance and intuition. Replaces mechanical Masonry.
*   **Breathing Room:** Dramatically increased `padding` and `margin` throughout.

### （四）交互与动态 (Interaction & Motion): The Unfurling of Ideas

Motion is meaningful and organic.

*   **Page Transitions:** Gentle, swift cross-fade with subtle vertical easing.
*   **Hover Effects (The Core Interaction):**
    1.  Slow background transition to a `Wash` color.
    2.  Simultaneous gentle fade-in of hidden metadata (tags, date).
    3.  No lifting or shadows. A quiet offering of information.
*   **Loading Animation:** Staggered fade-in for list items, as if being written in real-time.

### （五）材质与肌理 (Texture & Material): The Touch of the Hand

Subtle introduction of physical material.

*   **Paper Texture:** A fine, seamless grain texture applied as a tiled background to the `Paper` color.
*   **Image Treatment:** A thin, 1px keyline border in `Ink` color around all images, framing them as deliberate artifacts.
