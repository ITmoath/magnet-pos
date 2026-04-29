'use client'

import Image from 'next/image'
import { useEffect } from 'react'
import { motion, type Variants } from 'framer-motion'
import { Plus, ShoppingBag } from 'lucide-react'
import { burgerHouseMenu } from '@/data/mockData'
import { usePOSStore, useCartActions } from '@/store/usePOSStore'

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
  const categories = burgerHouseMenu.menuCategories
  const products = burgerHouseMenu.menu
  const hasActiveCategory = categories.some((cat) => cat.id === activeCategory)

  useEffect(() => {
    if (!hasActiveCategory && categories.length > 0) {
      setActiveCategory(categories[0].id)
    }
  }, [categories, hasActiveCategory, setActiveCategory])

  const filtered = hasActiveCategory
    ? products.filter((p) => p.category === activeCategory)
    : products

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Category Tabs */}
      <div className="flex gap-2 px-4 pt-4 pb-3 overflow-x-auto scrollbar-hide flex-shrink-0">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
              activeCategory === cat.id
                ? 'bg-[#24275D] text-white shadow-lg shadow-[#24275D]/30'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-[#24275D]/40 hover:text-[#24275D]'
            }`}
          >
            {cat.name}
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

function ProductCard({
  product,
  onAdd,
}: {
  product: (typeof burgerHouseMenu.menu)[number]
  onAdd: () => void
}) {
  return (
    <motion.div
      variants={itemVariants}
      whileTap={{ scale: 0.97 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#24275D]/20 transition-all overflow-hidden group"
    >
      {/* Product Image */}
      <div className="relative bg-gradient-to-br from-slate-50 to-gray-100 h-28 group-hover:from-[#24275D]/5 group-hover:to-[#24275D]/10 transition-colors">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 1280px) 50vw, 33vw"
          className="object-cover"
        />
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
