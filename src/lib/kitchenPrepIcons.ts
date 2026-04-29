import type { LucideIcon } from 'lucide-react'
import {
  Apple,
  Beef,
  Candy,
  Cherry,
  Coffee,
  Cookie,
  CupSoda,
  Droplets,
  Drumstick,
  Egg,
  Fish,
  Flame,
  GlassWater,
  IceCream,
  Leaf,
  Layers,
  Milk,
  Package,
  Pizza,
  Salad,
  Sandwich,
  Sparkles,
  Wheat,
} from 'lucide-react'

export interface PrepIngredientVisual {
  Icon: LucideIcon
  /** ألوان حاوية الأيقونة (خلفية + لون الرسم) */
  boxClass: string
}

type Rule = { test: RegExp; Icon: LucideIcon; boxClass: string }

/** ترتيب الأنماط: الأكثر تحديداً أولاً */
const RULES: Rule[] = [
  { test: /حلقات بصل|بصل مكرمل/, Icon: Layers, boxClass: 'bg-violet-100 text-violet-800' },
  { test: /بصل/, Icon: Layers, boxClass: 'bg-violet-100 text-violet-800' },
  { test: /خبز|توست|عجينة/, Icon: Wheat, boxClass: 'bg-amber-100 text-amber-900' },
  { test: /بيبروني|لحم|بقري/, Icon: Beef, boxClass: 'bg-rose-100 text-rose-800' },
  { test: /دجاج|فيليه/, Icon: Drumstick, boxClass: 'bg-orange-100 text-orange-800' },
  { test: /تونة|سمك/, Icon: Fish, boxClass: 'bg-cyan-100 text-cyan-800' },
  { test: /جبن|موتزاريلا|شيدر/, Icon: Milk, boxClass: 'bg-yellow-100 text-yellow-900' },
  { test: /طماطم/, Icon: Apple, boxClass: 'bg-red-100 text-red-800' },
  { test: /خس/, Icon: Leaf, boxClass: 'bg-emerald-100 text-emerald-800' },
  { test: /خيار/, Icon: Salad, boxClass: 'bg-green-100 text-green-800' },
  { test: /فلفل|زيتون|فطر|ريحان|خضار/, Icon: Salad, boxClass: 'bg-lime-100 text-lime-900' },
  { test: /كول سلو/, Icon: Salad, boxClass: 'bg-emerald-100 text-emerald-800' },
  { test: /بطاطس/, Icon: Cookie, boxClass: 'bg-amber-50 text-amber-900' },
  { test: /مخلل/, Icon: Package, boxClass: 'bg-lime-50 text-lime-900' },
  { test: /صلصة|مايونيز|غمس/, Icon: Droplets, boxClass: 'bg-sky-100 text-sky-800' },
  { test: /زيت/, Icon: Droplets, boxClass: 'bg-lime-50 text-lime-800' },
  { test: /أوريغانو|توابل/, Icon: Sparkles, boxClass: 'bg-stone-100 text-stone-700' },
  { test: /ملح/, Icon: Sparkles, boxClass: 'bg-slate-100 text-slate-600' },
  { test: /شاي/, Icon: Coffee, boxClass: 'bg-emerald-50 text-emerald-900' },
  { test: /قهوة|إسبريسو|أمريكانو/, Icon: Coffee, boxClass: 'bg-stone-200 text-stone-900' },
  { test: /كولا|علبة|كم علبة|مشروب غازي/, Icon: CupSoda, boxClass: 'bg-slate-100 text-slate-800' },
  { test: /قشة/, Icon: Sparkles, boxClass: 'bg-pink-50 text-pink-700' },
  { test: /عصير|برتقال/, Icon: GlassWater, boxClass: 'bg-orange-50 text-orange-700' },
  { test: /تبريد|ثلج/, Icon: IceCream, boxClass: 'bg-sky-50 text-sky-700' },
  { test: /سكر|بدون سكر/, Icon: Candy, boxClass: 'bg-pink-100 text-pink-800' },
  { test: /حليب/, Icon: Milk, boxClass: 'bg-zinc-100 text-zinc-800' },
  { test: /بيتزا/, Icon: Pizza, boxClass: 'bg-red-50 text-red-800' },
  { test: /ساندويش|ساندوتش/, Icon: Sandwich, boxClass: 'bg-amber-50 text-amber-900' },
  { test: /كيك|شوكولاتة/, Icon: Candy, boxClass: 'bg-amber-100 text-amber-900' },
  { test: /آيس كريم|آيس/, Icon: IceCream, boxClass: 'bg-indigo-100 text-indigo-800' },
  { test: /كريمة/, Icon: Droplets, boxClass: 'bg-stone-100 text-stone-700' },
  { test: /نكهة/, Icon: Cherry, boxClass: 'bg-fuchsia-100 text-fuchsia-800' },
  { test: /بيض/, Icon: Egg, boxClass: 'bg-yellow-50 text-yellow-900' },
  { test: /ساخن|سخن|حرار/, Icon: Flame, boxClass: 'bg-orange-100 text-orange-800' },
]

const DEFAULT: PrepIngredientVisual = {
  Icon: Sparkles,
  boxClass: 'bg-slate-100 text-slate-600',
}

export function getPrepIngredientVisual(label: string): PrepIngredientVisual {
  const normalized = label.trim()
  for (const rule of RULES) {
    if (rule.test.test(normalized)) {
      return { Icon: rule.Icon, boxClass: rule.boxClass }
    }
  }
  return DEFAULT
}
