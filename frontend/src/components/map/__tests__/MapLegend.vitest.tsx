import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MapLegend from '../MapLegend'
import {
  AREA_LEGEND_CATEGORIES,
  DEFAULT_CATEGORY_AREA_FILL,
  getCategoryAreaFill,
  getCategoryLabel,
} from '../../../services/roomDisplay'

/** jsdom has no matchMedia; MapLegend falls back to open, which is what these assert. */
describe('MapLegend', () => {
  it('lists every legend category plus an "other" row', () => {
    render(<MapLegend />)

    const items = screen.getByRole('list').querySelectorAll('li')
    expect(items).toHaveLength(AREA_LEGEND_CATEGORIES.length + 1)

    for (const category of AREA_LEGEND_CATEGORIES) {
      expect(screen.getByText(getCategoryLabel(category))).toBeInTheDocument()
    }
  })

  it('paints each swatch with the same fill the map uses for that category', () => {
    render(<MapLegend />)

    for (const category of AREA_LEGEND_CATEGORIES) {
      const swatch = screen.getByTestId(`legend-swatch-${category}`)
      expect(swatch).toHaveStyle({ backgroundColor: getCategoryAreaFill(category) })
    }
    expect(screen.getByTestId('legend-swatch-other')).toHaveStyle({
      backgroundColor: DEFAULT_CATEGORY_AREA_FILL,
    })
  })

  it('collapses and expands when the header is clicked', async () => {
    const user = userEvent.setup()
    render(<MapLegend />)

    const toggle = screen.getByRole('button', { name: /ประเภทพื้นที่/ })
    expect(toggle).toHaveAttribute('aria-expanded', 'true')

    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('list', { hidden: true })).toHaveAttribute('hidden')

    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('list')).not.toHaveAttribute('hidden')
  })
})
