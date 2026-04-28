'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { motion, type Variants } from 'framer-motion'
import { Plus, ShoppingBag } from 'lucide-react'
import { usePOSStore, useCartActions } from '@/store/usePOSStore'

export interface Product {
  id: string
  name: string
  price: number
  category: string
  /** مسار الصورة تحت `public`، مثال: `/menu/classic-beef.png` */
  image?: string
  emoji: string
  description?: string
  ingredients: string[]
}

const CATEGORIES = [
  { id: 'all', label: 'الكل' },
  { id: 'burger', label: '🍔 برجر' },
  { id: 'sides', label: '🍟 مقبلات' },
  { id: 'drinks', label: '🥤 مشروبات' },
]

const PRODUCTS: Product[] = [
  {
    id: 'b-beef',
    name: 'برجر لحم بقري',
    price: 36,
    category: 'burger',
    image: '/menu/classic-beef.png',
    emoji: '🥩',
    description: 'عرض لحم بقري مفروم 180جم',
    ingredients: [
      'خبز برجر',
      'لحم بقري مفروم 180جم',
      'جبن أمريكي',
      'بصل أحمر',
      'خس',
      'كاتشب وماسترد',
    ],
  },
  {
    id: 'b-crispy',
    name: 'برجر كرسبي',
    price: 34,
    category: 'burger',
    image: '/menu/crispy.png',
    emoji: '🍗',
    description: 'صدر دجاج مقرمش',
    ingredients: [
      'خبز برجر',
      'فيليه دجاج كرسبي',
      'مايونيز حار',
      'خس',
      'مخلل',
      'جبن شيدر (اختياري)',
    ],
  },
  {
    id: 'b-broast',
    name: 'بروست',
    price: 35,
    category: 'burger',
    image: '/menu/broast.png',
    emoji: '🍗',
    description: 'صدر دجاج بروست مقلي',
    ingredients: [
      'خبز برجر',
      'صدر دجاج بروست متبل',
      'مايونيز',
      'خس',
      'شرائح طماطم',
      'مخلل',
    ],
  },
  {
    id: 'side-chicken-fries',
    name: 'تشكن فرايز',
    price: 18,
    category: 'sides',
    image: '/menu/chicken-fries.png',
    emoji: '🐔',
    description: 'شرائح دجاج مقرمشة',
    ingredients: [
      'شرائح دجاج بانِد',
      'تغليف كرسبي',
      'توابل',
      'زيت القلي',
      'صلصة باربيكيو أو رانش',
    ],
  },
  {
    id: 'd-water',
    name: 'موية',
    price: 3,
    category: 'drinks',
    image: '/menu/water.png',
    emoji: '💧',
    description: 'ماء معقول',
    ingredients: ['ماء معبأ أو كوب حسب الطلب', 'ثلج (اختياري)'],
  },
  {
    id: 'd-pepsi',
    name: 'ببسي',
    price: 6,
    category: 'drinks',
    image: '/menu/pepsi.png',
    emoji: '🥤',
    description: 'مشروب غازي',
    ingredients: ['مشروب ببسي جاهز', 'تبريد', 'ثلج', 'قشة (اختياري)'],
  },
  {
    id: 'd-citrus',
    name: 'حمضيات',
    price: 7,
    category: 'drinks',
    image: '/menu/citrus.png',
    emoji: '🍋',
    description: 'مشروب حمضيات',
    ingredients: ['حمضيات (برتقال، ليمون، جريب فروت)', 'ماء أو صودا', 'سكر خفيف', 'ثلج'],
  },
]

const VALID_CATEGORY_IDS = new Set(CATEGORIES.map((c) => c.id))

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

  useEffect(() => {
    if (!VALID_CATEGORY_IDS.has(activeCategory)) {
      setActiveCategory('all')
    }
  }, [activeCategory, setActiveCategory])

  const filtered =
    activeCategory === 'all' ? PRODUCTS : PRODUCTS.filter((p) => p.category === activeCategory)

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
                onAdd={() =>
                  addToCart({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    category: product.category,
                    ingredients: product.ingredients,
                  })
                }
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
      {/* صورة الوجبة أو الإيموجي كاحتياط */}
      <div className="relative h-36 w-full overflow-hidden bg-gradient-to-br from-slate-50 to-gray-100 group-hover:from-[#24275D]/5 group-hover:to-[#24275D]/10 transition-colors">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover object-center transition-transform duration-300 group-hover:scale-[1.04]"
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 280px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-5xl">
            {product.emoji}
          </div>
        )}
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
