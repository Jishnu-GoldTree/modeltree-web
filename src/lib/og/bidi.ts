/**
 * Minimal bidi reordering for satori.
 *
 * satori lays glyphs out in logical order, left to right, and does not run the
 * Unicode bidirectional algorithm — `direction: rtl` changes nothing, which is
 * verifiable: the rendered PNG comes out byte-identical with and without it.
 * So Hebrew arrives on the card reversed, letter by letter.
 *
 * The fix is to hand satori text that is already in *visual* order. This is a
 * deliberately small subset of UAX #9, sized to the share-card copy: one
 * paragraph, base direction RTL, containing Hebrew, digits, Latin and
 * punctuation. It is not a general bidi implementation and should not grow
 * into one — if the cards ever need real mixed-script paragraphs, reach for a
 * library instead.
 */

/** Hebrew block, including the maqaf and the presentation forms Heebo covers. */
const RTL_CHAR = /[֐-׿יִ-ﭏ]/
/** Runs that keep their own left-to-right order: numbers and Latin words. */
const LTR_CHAR = /[A-Za-z0-9]/

type Kind = "rtl" | "ltr" | "space"
type Run = { text: string; kind: Kind }

/**
 * Splits into directional runs, with whitespace as its own kind.
 *
 * Whitespace has to be a separator rather than part of a neighbouring run:
 * attached, it ends up on the outside edge when the run order flips, which is
 * how "40,000 מודלים" first came out as "םילדומ40,000" with the space stranded
 * at the end.
 */
function toRuns(text: string): Run[] {
  const runs: Run[] = []

  const push = (char: string, kind: Kind) => {
    const previous = runs.at(-1)
    if (previous?.kind === kind) previous.text += char
    else runs.push({ text: char, kind })
  }

  for (const char of text) {
    if (/\s/.test(char)) push(char, "space")
    else if (RTL_CHAR.test(char)) push(char, "rtl")
    else if (LTR_CHAR.test(char)) push(char, "ltr")
    else {
      // Punctuation and symbols take the direction of what they follow, so a
      // comma after a Hebrew word flips with that word rather than drifting.
      const previous = runs.at(-1)
      push(char, previous && previous.kind !== "space" ? previous.kind : "rtl")
    }
  }

  return runs
}

/**
 * Reorders a logical-order string into visual order for an RTL paragraph.
 *
 * Runs are emitted right to left. An RTL run is reversed whole — punctuation
 * included, which is what puts a trailing comma on the correct side — while
 * LTR runs keep their own order, so "40,000" and "MODELTREE" still read
 * correctly inside Hebrew.
 */
export function toVisualRtl(text: string) {
  return toRuns(text)
    .reverse()
    .map((run) => (run.kind === "rtl" ? [...run.text].reverse().join("") : run.text))
    .join("")
}
