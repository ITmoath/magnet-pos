export type MenuCategory = {
    id: string;
    name: string;
  };
  
  export type MenuItem = {
    id: string;
    restaurantId: string;
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
    popular?: boolean;
  };
  
  export type RestaurantType = {
    id: string;
    name: string;
    image: string;
    coverImage: string;
    rating: number;
    reviewCount: number;
    cuisine: string;
    eta: string;
    location: string;
    deliveryFee: number;
    minOrder: number;
    tags: string[];
    description: string;
    badge?: string;
    isOpen: boolean;
    menuCategories: MenuCategory[];
    menu: MenuItem[];
  };
  
  export const burgerHouseMenu: RestaurantType = {
    id: "r1", // هذا ID وهمي، سنتعامل مع ID السوبابيس الحقيقي عند إرسال الطلب
    name: "برجر هاوس",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900&h=400&fit=crop",
    rating: 4.8,
    reviewCount: 1240,
    cuisine: "برجر أمريكي",
    eta: "25-35",
    location: "حي النزهة، الرياض",
    deliveryFee: 10,
    minOrder: 40,
    tags: ["برجر", "الأكثر طلباً", "توصيل سريع"],
    description: "أشهر برجر في الرياض. لحوم طازجة يومياً وإضافات مميزة بنكهات أصيلة.",
    badge: "الأكثر طلباً",
    isOpen: true,
    menuCategories: [
      { id: "mc1", name: "الأكثر طلباً" },
      { id: "mc2", name: "برجر" },
      { id: "mc3", name: "إضافات" },
      { id: "mc4", name: "مشروبات" },
    ],
    menu: [
      {
        id: "m1",
        restaurantId: "r1",
        name: "برجر كلاسيك",
        description: "لحم بقري طازج مع خس وطماطم وصوص خاص",
        price: 60,
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=200&fit=crop",
        category: "mc2",
        popular: true,
      },
      {
        id: "m2",
        restaurantId: "r1",
        name: "برجر دبل",
        description: "ضعف اللحم مع جبنة شيدر ومخللات",
        price: 74,
        image: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=300&h=200&fit=crop",
        category: "mc2",
        popular: true,
      },
      {
        id: "m3",
        restaurantId: "r1",
        name: "كريسبي برجر",
        description: "دجاج مقرمش محضر بتوابل سرية",
        price: 55,
        image: "https://images.unsplash.com/photo-1639024471283-03518883512d?w=300&h=200&fit=crop",
        category: "mc1",
        popular: true,
      },
      {
        id: "m4",
        restaurantId: "r1",
        name: "بطاطس مقلية",
        description: "بطاطس ذهبية مقرمشة مع صوص الكاتشب",
        price: 18,
        image: "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=300&h=200&fit=crop",
        category: "mc3",
      },
      {
        id: "m5",
        restaurantId: "r1",
        name: "مشروب غازي",
        description: "بيبسي أو كولا ٥٠٠مل",
        price: 8,
        image: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=300&h=200&fit=crop",
        category: "mc4",
      },
      {
        id: "m6",
        restaurantId: "r1",
        name: "صوص خاص",
        description: "صوص المطعم السري المميز",
        price: 5,
        image: "https://images.unsplash.com/photo-1598514983318-2f64f8f4796c?w=300&h=200&fit=crop",
        category: "mc3",
      },
    ],
  };