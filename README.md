# Game Design Doc
Type: Turn-based battler, single active fighter with swap mechanic (Pokémon-adjacent structure) No player-insert character — narrative plays out entirely through the existing cast's dialogue and relationships. The player directs tactics; they are not a character in the story. Scope: 4-day build. 3 fighters, 1 boss, 2 regular fights + boss, 2 guaranteed cutscenes (1 optional).

# Roster (3 fighters)
# Macrophage
- Type: Phagocyte (innate)
- Strong vs. Bacteria (incl. boss) | Weak vs. N/A 
# Moves (draft — adjust freely):
- Shoulder Check — standard damage (Attack description: “Break their bones.”)
- Crush — 50% of enemy health (Attack description: “Wrap your arms around them and crush.”)
- Grapple (active) — standard damage, has a small chance of keeping enemy immobilized for 2 turns, reducing their damage significantly (Attack description: “Where do you think you’re going?”)
- Tank (passive) — small chance to reduce incoming damage
# Neutrophil
- Type: Phagocyte (innate)
- Strong vs. Bacteria (incl. boss) | Weak vs. Viruses
# Moves (draft):
- Slash — standard damage (Attack description: “Slash them.”)
- Bite — Causes bleed/periodic damage, takes away 10% of enemy health following their turn as well as a small amount of damage for the initial hit (Attack description: “Take a bite.”)
- Pursue (active) — Only available if the enemy has 20% or less health left. Small chance to one shot the target. (Attack description: “Don’t let them get away.”)
- Corrosive Blood (passive) — After an enemy attacks him, deal a small amount of damage (~3-5%) to the enemy. Functions similarly to the Thorns enchantment in Minecraft in the sense it reflects some damage.
# Cytotoxic T Cell
- Type: Lymphocyte/CD8 (adaptive)
- Strong vs. Viruses | Weak vs. Bacteria (incl. boss) — intentionally the "wrong tool" fighter for this fight
# Moves (draft):
- Fire — standard damage (Attack description: “Aim your gun and shoot.”)
- Stab — Causes bleed/periodic damage, takes away 10% of enemy health following their turn as well as a standard amount of damage for the initial hit (Attack description: “Stab them.”) 
- Precision Shot (active) — reliable single-target damage, small chance to land critically, doubling the damage this hit causes. (Attack description: “Take them out completely.”)
- Unshaken (passive) — resistant to flinch/stun effects, flavor: reads as unbothered no matter what

Design intent: Macrophage and Neutrophil are both favored vs. the TB boss; CTC is not. The player should feel the pull to lean on the phagocytes for the boss, while CTC remains useful for regular fights — this is what sells the "right tool for the job" lesson without extra systems.

# Weakness Chart:
- Neutrophil is weak against viruses but strong against bacteria.
- Cytotoxic T Cell is strong against viruses but weak against bacteria.
- Macrophage has no weaknesses as macrophages IRL handle both without issue.

# Enemies
Regular encounters (x2, before boss)
Generic/unnamed microbe enemies (x1 bacteria, x1 virus PER FIGHT) — palette-swap variants acceptable (e.g. "weakened strain" / "resistant strain" of the same base sprite)
Purpose: teach the weakness chart risk-free (fight 1), then test it under mild pressure (fight 2)
Sprites needed: idle + defeated pose per enemy (can reuse across both fights with palette swap)
# Boss: Tuberculosis (TB)
Bacterial — Macrophage/Neutrophil favored, CTC disadvantaged
Mute — no mouth in character design, no dialogue required. Characterize entirely through combat behavior/portrait expression, not lines.
Suggested extra: one "telegraph" pose/frame before its strongest attack, to give players a tell to react to (optional polish, not required)

# Damage Rule
No fight can be won with zero damage taken — enemy attacks always chip at least minor HP even on a "successful" turn. This guarantees the post-battle "patched up" framing is always earned, never arbitrary, and reinforces the theme that WBCs aren't invincible.
 
# Stage Structure
Cutscene 1 (cold open / pre-fight-1) — hub scene, establishes tone and dynamics, no battle content to reference yet
Regular Fight 1 — teaches the weakness chart, low pressure
Regular Fight 2 — tests the weakness chart, matchup should meaningfully punish the wrong fighter choice
Cutscene 2 (pre-boss) — shorter, tenser than Cutscene 1; good spot for a CTC-texting-Arden beat
Boss Fight: TB
(Optional) Cutscene 3 (post-boss victory beat) — cut first if time runs short; the win screen alone can close the loop

# Cutscene Format ("Rest Hub")
Setting: break room / barracks, NOT a medbay — fighters are already bandaged/patched up when the scene starts, not mid-treatment. Avoids needing to draw medical equipment or a medic character.
Format: one static reused background, fixed character positions, click-to-talk hotspots on familiar pairings — NOT a forced linear sequence.
Groupings: characters cluster by established familiarity, not by battle performance:
CTC — off to the side, checking his phone (texting Arden)
Macrophage & Neutrophil — casual coworker banter
(KTC/DC and others not in this build's roster, but pattern applies if roster expands later)
Dialogue should NOT reference specific battle performance or benched characters directly. Keep it relationship-flavored/general, not a battle recap — this avoids needing to write conditional dialogue for "if the player used X vs Y."
Bandaging: keep uniform/subtle (one shared "just came out of a fight" visual tell), not unique wounds per character — saves art time.

# Extras / Gallery Page
Accessible from title screen, not gated behind game completion
Per character: neutral portrait + 2-3 sentence bio + expandable "Relationships" section Spoiler warning shown once on first open (soft gate, not a lock):

 "Heads up! This section touches on character dynamics that show up gradually through the game's cutscenes. If you'd rather meet everyone through the story first, feel free to head back — otherwise, go ahead." [Go Back] [Continue]




# Art Specs
Sprite resolution: 32x32 pixel base, displayed scaled ×4 (128x128) using nearest-neighbor/pixelated scaling — keep pixels crisp, not blurred
Per fighter, minimum: idle animation (2-3 frame loop), regular/ready sprite, injured/fainting sprite
CTC exception: reuse existing idle animation (holding AR-15) from prior project — extract frames from saved GIF via code rather than redrawing; confirm resolution matches the other fighters before dropping in, or standardize the rest to match CTC's if it's a different size
Enemies (non-boss): idle + defeated sprite only, 2 per enemy type
Boss: same minimum as enemies, telegraph pose optional
Backgrounds: hand-drawn simplified pixel backgrounds preferred over code-generated placeholders where time allows (battle background, home screen, rest-hub background) — keep simple (flat gradient + one silhouette layer is enough)

# UI Style Notes
Retro/pixel-game aesthetic — explicitly request pixelated image rendering (crisp sprite scaling, not smoothed/blurred), a retro-style font, chunky/blocky borders instead of rounded modern ones, flat color fills rather than smooth gradients
Battle screen: health bars, move menu, damage numbers that pop/fade briefly on hit
Cutscene/dialogue box: text box docked at bottom of screen, character portrait to one side — visual-novel-style presentation, but NOT branching choices (no VN-style decision trees, this stays linear)

# Build Order (do not deviate without reason)
1. Core battle loop with placeholder fighters (Fighter A/B, one attack each, HP, turn order, win/lose) — get this fully working before anything else
2 Wire in real roster (Macrophage, Neutrophil, CTC) + weakness chart + move effects
3 Battle screen UI/styling pass
4. Rest hub cutscene system (background + hotspots + dialogue box) using placeholder text first, real dialogue after
5. Title/home screen
6. Extras/gallery page (cut first if time is short)
7. Art swap-in: real sprites and backgrounds replace placeholders
8. Playtest, bug fix, polish (screen shake, sound if time allows), package for submission


Reminder to self mid-build: if behind schedule, cut in this order — Extras page → Cutscene 3 (post-boss) → boss telegraph pose → sound/screen shake polish. Do not cut: core battle loop, weakness chart, at least 1 cutscene, real character art for the 3 fighters + boss.
