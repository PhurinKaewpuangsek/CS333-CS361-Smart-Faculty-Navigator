import {
  Atom,
  Bell,
  BookOpen,
  Briefcase,
  ChalkboardTeacher,
  Flask,
  Gear,
  MapPin,
  Package,
  Stairs,
  Toilet,
  Users,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import { FemaleRestroomIcon, MaleRestroomIcon } from './restroomIcons.tsx'
import { getRestroomGender } from '../services/roomDisplay.ts'

/**
 * Phosphor icon for a room category.
 *
 * Shared by the room detail badge and the map pins so a category always reads as the
 * same glyph wherever it appears. Returns the component itself (not an element) so each
 * caller can pick its own size and weight.
 *
 * `name` is the room's Thai name, used only to split the restrooms into the man and
 * woman pictograms — two doors side by side need to be told apart at a glance.
 */
export function getCategoryIcon(category: string, name?: string): Icon {
  const key = (category || '').toLowerCase()
  if (key.includes('lab')) return Flask
  if (key.includes('lecture')) return BookOpen
  if (key.includes('seminar')) return ChalkboardTeacher
  if (key.includes('office')) return Briefcase
  if (key.includes('toilet') || key.includes('restroom')) {
    const gender = getRestroomGender(name)
    if (gender === 'male') return MaleRestroomIcon
    if (gender === 'female') return FemaleRestroomIcon
    return Toilet
  }
  if (key.includes('stair')) return Stairs
  if (key.includes('student') || key.includes('meeting') || key.includes('staff')) return Users
  if (key.includes('research')) return Atom
  if (key.includes('utility')) return Gear
  if (key.includes('storage')) return Package
  if (key.includes('service')) return Bell
  return MapPin
}
