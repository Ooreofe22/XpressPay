import React from 'react'
import { GraduationCap, Receipt, Smartphone, Tv, Wifi, Zap } from 'lucide-react'

/**
 * billerCategoryPath comes straight from the XpressPay biller catalog and
 * isn't a fixed enum on our side, so this matches loosely by substring
 * instead of assuming an exact set of category strings.
 */
function resolve(categoryPath: string | null) {
  const p = (categoryPath ?? '').toLowerCase()
  if (p.includes('airtime')) return { icon: Smartphone, className: 'bg-primary-tint text-primary', label: 'Airtime' }
  if (p.includes('data')) return { icon: Wifi, className: 'bg-accent-tint text-accent', label: 'Data' }
  if (p.includes('electric') || p.includes('power')) return { icon: Zap, className: 'bg-warning/10 text-warning', label: 'Electricity' }
  if (p.includes('tv') || p.includes('cable')) return { icon: Tv, className: 'bg-primary-tint text-primary-dark', label: 'Cable TV' }
  if (p.includes('waec') || p.includes('exam') || p.includes('education')) {
    return { icon: GraduationCap, className: 'bg-secondary text-foreground', label: 'Education' }
  }
  return { icon: Receipt, className: 'bg-secondary text-muted-foreground', label: categoryPath ?? 'Biller' }
}

export function categoryLabel(categoryPath: string | null) {
  return resolve(categoryPath).label
}

export function CategoryIcon({
  category,
  size = 'md',
}: {
  category: string | null
  size?: 'sm' | 'md'
}) {
  const c = resolve(category)
  const Icon = c.icon
  const box = size === 'sm' ? 'h-8 w-8 rounded-lg' : 'h-10 w-10 rounded-[12px]'
  return (
    <span className={`flex shrink-0 items-center justify-center ${box} ${c.className}`}>
      <Icon size={size === 'sm' ? 15 : 18} strokeWidth={2.25} />
    </span>
  )
}
