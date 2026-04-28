'use client'

import { motion, type Variants } from 'framer-motion'
import { Plus, ShoppingBag } from 'lucide-react'
import { usePOSStore, useCartActions } from '@/store/usePOSStore'

export interface Product {
  id: string
  name: string
  price: number
  category: string
  emoji: string
  description?: string
}

const CATEGORIES = [
  { id: 'all', label: 'الكل' },
  { id: 'burger', label: '🍔 برجر' },
  { id: 'pizza', label: '🍕 بيتزا' },
  { id: 'sandwich', label: '🥪 ساندويش' },
  { id: 'drinks', label: '🥤 مشروبات' },
  { id: 'desserts', label: '🍰 حلويات' },
  { id: 'sides', label: '🍟 مقبلات' },
]

const PRODUCTS: Product[] = [
  { id: 'p1', name: 'برجر كلاسيك', price: 32, category: 'burger', emoji: '🍔', description: 'لحم بقري 150جم مع جبن شيدر' },
  { id: 'p2', name: 'برجر دبل', price: 45, category: 'burger', emoji: '🍔', description: 'قطعتان لحم مع صلصة سرية' },
  { id: 'p3', name: 'برجر دجاج', price: 28, category: 'burger', emoji: '🍗', description: 'دجاج مقرمش مع كول سلو' },
  { id: 'p4', name: 'بيتزا مارغريتا', price: 45, category: 'pizza', emoji: '🍕', description: 'صلصة طماطم وجبن موتزاريلا' },
  { id: 'p5', name: 'بيتزا بيبروني', price: 55, category: 'pizza', emoji: '🍕', description: 'بيبروني وجبن موتزاريلا مضاعف' },
  { id: 'p6', name: 'بيتزا خضار', price: 42, category: 'pizza', emoji: '🥦', description: 'خضار طازجة متنوعة' },
  { id: 'p7', name: 'ساندويش كلوب', price: 22, category: 'sandwich', emoji: '🥪', description: 'دجاج وخس وطماطم' },
  { id: 'p8', name: 'ساندويش تونة', price: 18, category: 'sandwich', emoji: '🥙', description: 'تونة مع مايونيز وخضار' },
  { id: 'p9', name: 'كولا', price: 8, category: 'drinks', emoji: '🥤', description: '330مل' },
  { id: 'p10', name: 'عصير برتقال', price: 15, category: 'drinks', emoji: '🍊', description: 'طازج 100%' },
  { id: 'p11', name: 'شاي', price: 6, category: 'drinks', emoji: '🍵', description: 'أكواب سريعة' },
  { id: 'p12', name: 'قهوة', price: 12, category: 'drinks', emoji: '☕', description: 'إسبريسو أو أمريكانو' },
  { id: 'p13', name: 'كيك شوكولاتة', price: 18, category: 'desserts', emoji: '🍰', description: 'قطعة فاخرة' },
  { id: 'p14', name: 'آيس كريم', price: 12, category: 'desserts', emoji: '🍦', description: 'فانيليا أو شوكولاتة' },
  { id: 'p15', name: 'بطاطس كبيرة', price: 14, category: 'sides', emoji: '🍟', description: 'مقرمشة ومملحة' },
  { id: 'p16', name: 'حلقات بصل', price: 16, category: 'sides', emoji: '🧅', description: 'مع صلصة الغمس' },
]

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 280, damping: 22 },
  },
}

export default function ProductGrid() {
  const activeCategory = usePOSStore((s) => s.activeCategory)
  const setActiveCategory = usePOSStore((s) => s.setActiveCategory)
  const { addToCart } = useCartActions()

  const filtered = activeCategory === 'all'
    ? PRODUCTS
    : PRODUCTS.filter((p) => p.category === activeCategory)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Category Tabs */}
      <div className="flex gap-2 px-4 pt-4 pb-3 overflow-x-auto scrollbar-hide flex-shrink-0">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
              activeCategory === cat.id
                ? 'bg-[#24275D] text-white shadow-lg shadow-[#24275D]/30'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-[#24275D]/40 hover:text-[#24275D]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
            <ShoppingBag size={48} strokeWidth={1.5} />
            <p className="text-sm">لا توجد منتجات في هذا التصنيف</p>
          </div>
        ) : (
          <motion.div
            key={activeCategory}
            className="grid grid-cols-2 xl:grid-cols-3 gap-3"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAdd={() => addToCart({ id: product.id, name: product.name, price: product.price, category: product.category })}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}

function ProductCard({ product, onAdd }: { product: Product; onAdd: () => void }) {
  return (
    <motion.div
      variants={itemVariants}
      whileTap={{ scale: 0.97 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#24275D]/20 transition-all overflow-hidden group"
    >
      {/* Emoji Banner */}
      <div className="bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center text-5xl py-5 group-hover:from-[#24275D]/5 group-hover:to-[#24275D]/10 transition-colors">
        {product.emoji}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-bold text-gray-800 text-sm leading-snug">{product.name}</h3>
        {product.description && (
          <p className="text-xs text-gray-400 mt-0.5 leading-relaxed line-clamp-1">{product.description}</p>
        )}
        <div className="flex items-center justify-between mt-3">
          <span className="text-[#D22128] font-bold text-sm">
            {product.price.toFixed(2)} <span className="text-xs font-normal">ر.س</span>
          </span>
          <button
            onClick={onAdd}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[#24275D] text-white hover:bg-[#D22128] transition-colors shadow-sm"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
