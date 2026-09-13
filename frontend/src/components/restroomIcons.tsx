import { forwardRef } from 'react'
import type { IconProps } from '@phosphor-icons/react'

/**
 * Restroom pictograms — the standing figures used on restroom signage worldwide
 * (AIGA / US DOT symbol set, public domain), redrawn here as plain geometry.
 *
 * The Phosphor set has one generic `Toilet` glyph, which cannot tell a student which
 * of two adjacent doors is theirs. These two fill that gap and are shaped to Phosphor's
 * `Icon` contract (256 viewBox, `size`/`color` props, forwarded ref) so they drop into
 * `getCategoryIcon` and render through the same `createElement` call as every other icon.
 * `weight` is accepted and ignored: there is only a filled form.
 */

/** Head, shared by both figures. */
const HEAD = { cx: 128, cy: 42, r: 26 }

/** Torso with arms at the sides, then two legs. */
const MALE_BODY =
  'M98 78H158L172 152L158 158L152 176H104L98 158L84 152Z' +
  'M106 176H122V240H106Z' +
  'M134 176H150V240H134Z'

/** Head over a flared dress whose outline takes in the arms, then two legs. */
const FEMALE_BODY =
  'M98 76H158L190 186H66Z' +
  'M108 186H122V240H108Z' +
  'M134 186H148V240H134Z'

function restroomIcon(body: string, testId: string) {
  return forwardRef<SVGSVGElement, IconProps>(function RestroomIcon(
    { size = 24, color = 'currentColor', alt, ...rest },
    ref
  ) {
    return (
      <svg
        ref={ref}
        data-testid={testId}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 256 256"
        width={size}
        height={size}
        fill={color}
        {...rest}
      >
        {alt ? <title>{alt}</title> : null}
        <circle cx={HEAD.cx} cy={HEAD.cy} r={HEAD.r} />
        <path d={body} />
      </svg>
    )
  })
}

export const MaleRestroomIcon = restroomIcon(MALE_BODY, 'icon-restroom-male')
export const FemaleRestroomIcon = restroomIcon(FEMALE_BODY, 'icon-restroom-female')
