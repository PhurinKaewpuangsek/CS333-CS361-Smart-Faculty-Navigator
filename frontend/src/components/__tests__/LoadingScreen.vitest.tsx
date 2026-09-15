import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoadingScreen from '../LoadingScreen'

describe('LoadingScreen', () => {
  it('covers the app with a loading message while the map data loads', () => {
    render(<LoadingScreen />)

    expect(screen.getByRole('status')).toHaveTextContent('กำลังโหลดแผนที่')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows the failure and retries when the button is pressed', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()

    render(<LoadingScreen error={new Error('Failed to fetch rooms: 500')} onRetry={onRetry} />)

    expect(screen.getByRole('alert')).toHaveTextContent('โหลดข้อมูลแผนที่ไม่สำเร็จ')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /ลองใหม่/ }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
