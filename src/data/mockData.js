export const initialRestaurants = [
  {
    id: "rest_1",
    name: "Pizza Hub & Co.",
    slug: "pizza-hub",
    logo: "https://img.icons8.com/fluency/196/pizza.png",
    banner: "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1200&auto=format&fit=crop",
    theme: {
      primaryColor: "#bd3838",
      secondaryColor: "#0f172a",
      textColor: "#ffffff",
      styleType: "glassmorphism"
    },
    timings: { open: "10:00", close: "23:00" },
    contact: {
      phone: "+91 9876543210",
      email: "info@pizzahub.com",
      address: "GF, Food Court, Premium Mall, New Delhi",
      socialLinks: { instagram: "@pizzahub", facebook: "pizzahubco", whatsapp: "9876543210" }
    },
    settings: { gstPercentage: 5, deliveryCharge: 39, minimumOrderAmount: 149 },
    tables: [
      { tableNo: "T1", qrCodeUrl: "" },
      { tableNo: "T2", qrCodeUrl: "" },
      { tableNo: "T3", qrCodeUrl: "" }
    ],
    isApproved: true,
    isActive: true,
    rating: 4.8,
    featured: true,
    subscriptionPlan: "premium"
  },
  {
    id: "rest_2",
    name: "The Curry Palace",
    slug: "curry-palace",
    logo: "https://img.icons8.com/fluency/196/curry.png",
    banner: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=80&w=1200&auto=format&fit=crop",
    theme: {
      primaryColor: "#eab308",
      secondaryColor: "#022c22",
      textColor: "#ffffff",
      styleType: "minimalist"
    },
    timings: { open: "11:00", close: "22:30" },
    contact: {
      phone: "+91 9988776655",
      email: "curry@palace.com",
      address: "Indiranagar 100ft road, Bangalore",
      socialLinks: { instagram: "@currypalace", facebook: "currypalace", whatsapp: "9988776655" }
    },
    settings: { gstPercentage: 5, deliveryCharge: 49, minimumOrderAmount: 199 },
    tables: [
      { tableNo: "B1", qrCodeUrl: "" },
      { tableNo: "B2", qrCodeUrl: "" }
    ],
    isApproved: true,
    isActive: true,
    rating: 4.6,
    featured: false,
    subscriptionPlan: "basic"
  },
  {
    id: "rest_3",
    name: "Green Garden (Vegan)",
    slug: "green-garden",
    logo: "https://img.icons8.com/fluency/196/salad.png",
    banner: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1200&auto=format&fit=crop",
    theme: {
      primaryColor: "#22c55e",
      secondaryColor: "#052e16",
      textColor: "#ffffff",
      styleType: "glassmorphism"
    },
    timings: { open: "08:00", close: "21:00" },
    contact: {
      phone: "+91 8877665544",
      email: "green@garden.com",
      address: "Linking Road, Bandra West, Mumbai",
      socialLinks: { instagram: "@greengarden", facebook: "greengarden", whatsapp: "8877665544" }
    },
    settings: { gstPercentage: 5, deliveryCharge: 29, minimumOrderAmount: 129 },
    tables: [
      { tableNo: "V1", qrCodeUrl: "" }
    ],
    isApproved: true,
    isActive: true,
    rating: 4.7,
    featured: true,
    subscriptionPlan: "premium"
  },
  {
    id: "rest_4",
    name: "Pasha's Waffles & Crepes",
    slug: "pashas-waffles",
    logo: "https://img.icons8.com/fluency/196/waffle.png",
    banner: "https://images.unsplash.com/photo-1562376502-6f769499c886?q=80&w=1200&auto=format&fit=crop",
    theme: {
      primaryColor: "#f43f5e",
      secondaryColor: "#0f172a",
      textColor: "#ffffff",
      styleType: "glassmorphism"
    },
    timings: { open: "09:00", close: "23:00" },
    contact: {
      phone: "+91 9999888866",
      email: "abbupasha62@gmail.com",
      address: "Hitech City Sector 2, Hyderabad",
      socialLinks: { instagram: "@pashaswaffles", facebook: "pashaswaffles", whatsapp: "9999888866" }
    },
    settings: { gstPercentage: 5, deliveryCharge: 30, minimumOrderAmount: 100 },
    tables: [
      { tableNo: "W1", qrCodeUrl: "" },
      { tableNo: "W2", qrCodeUrl: "" }
    ],
    isApproved: true,
    isActive: true,
    rating: 4.9,
    featured: true,
    subscriptionPlan: "premium"
  }
];

export const initialCategories = [
  { id: "cat_1", name: "Pizzas", image: "https://img.icons8.com/fluency/96/pizza.png", restaurantId: "rest_1" },
  { id: "cat_2", name: "Garlic Breads", image: "https://img.icons8.com/fluency/96/bread.png", restaurantId: "rest_1" },
  { id: "cat_3", name: "Desserts", image: "https://img.icons8.com/fluency/96/cupcake.png", restaurantId: "rest_1" },
  { id: "cat_4", name: "Main Course", image: "https://img.icons8.com/fluency/96/curry.png", restaurantId: "rest_2" },
  { id: "cat_5", name: "Breads", image: "https://img.icons8.com/fluency/96/roti.png", restaurantId: "rest_2" },
  { id: "cat_6", name: "Salads", image: "https://img.icons8.com/fluency/96/salad.png", restaurantId: "rest_3" },
  { id: "cat_7", name: "Smoothies", image: "https://img.icons8.com/fluency/96/smoothie.png", restaurantId: "rest_3" },
  { id: "cat_8", name: "Dessert Waffles", image: "https://img.icons8.com/fluency/96/waffle.png", restaurantId: "rest_4" }
];

export const initialMenus = [
  // Pizza Hub & Co
  {
    id: "menu_1",
    restaurantId: "rest_1",
    categoryId: "cat_1",
    name: "Margherita Supreme",
    description: "Classic mozzarella, sweet basil leaves, and cold-pressed extra virgin olive oil.",
    price: 249,
    discountPrice: 199,
    image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?q=80&w=600&auto=format&fit=crop",
    foodType: "veg",
    tags: { isSpicy: false, isBestseller: true, isTodaySpecial: true },
    inStock: true,
    addons: [
      { name: "Extra Cheese", price: 60 },
      { name: "Olive Toppings", price: 40 }
    ]
  },
  {
    id: "menu_2",
    restaurantId: "rest_1",
    categoryId: "cat_1",
    name: "Fiery Paneer & Capsicum",
    description: "Spicy marinated paneer cubes, red paprika, crisp green capsicum, and chili oil drizzle.",
    price: 349,
    discountPrice: 299,
    image: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?q=80&w=600&auto=format&fit=crop",
    foodType: "veg",
    tags: { isSpicy: true, isBestseller: true, isTodaySpecial: false },
    inStock: true,
    addons: [
      { name: "Jalapeno Extra", price: 30 },
      { name: "Cheese Burst Crust", price: 90 }
    ]
  },
  {
    id: "menu_3",
    restaurantId: "rest_1",
    categoryId: "cat_1",
    name: "Smoked Chicken Delight",
    description: "Tender chunks of smoked chicken breast, sweet golden corn, and double cheese.",
    price: 399,
    discountPrice: 349,
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=600&auto=format&fit=crop",
    foodType: "non-veg",
    tags: { isSpicy: false, isBestseller: false, isTodaySpecial: false },
    inStock: true,
    addons: [
      { name: "Extra Smoked Chicken", price: 80 }
    ]
  },
  {
    id: "menu_4",
    restaurantId: "rest_1",
    categoryId: "cat_2",
    name: "Cheesy Stuffed Garlic Bread",
    description: "Freshly baked garlic dough filled with loads of melting liquid cheese, sweet corn, and jalapenos.",
    price: 159,
    image: "https://images.unsplash.com/photo-1573145959956-e9fa7afc885e?q=80&w=600&auto=format&fit=crop",
    foodType: "veg",
    tags: { isSpicy: false, isBestseller: true, isTodaySpecial: false },
    inStock: true,
    addons: [
      { name: "Garlic Dip", price: 25 }
    ]
  },
  {
    id: "menu_5",
    restaurantId: "rest_1",
    categoryId: "cat_3",
    name: "Hot Chocolate Lava Cake",
    description: "Decadent chocolate cake filled with warm oozing liquid chocolate center.",
    price: 99,
    discountPrice: 89,
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=600&auto=format&fit=crop",
    foodType: "vegan",
    tags: { isSpicy: false, isBestseller: true, isTodaySpecial: true },
    inStock: true,
    addons: [
      { name: "Vanilla Ice Cream Scoop", price: 40 }
    ]
  },

  // Curry Palace
  {
    id: "menu_6",
    restaurantId: "rest_2",
    categoryId: "cat_4",
    name: "Shahi Butter Paneer",
    description: "Cottage cheese cubes simmered in rich tomato gravy finished with fresh dairy cream.",
    price: 289,
    discountPrice: 249,
    image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?q=80&w=600&auto=format&fit=crop",
    foodType: "veg",
    tags: { isSpicy: false, isBestseller: true, isTodaySpecial: true },
    inStock: true,
    addons: []
  },
  {
    id: "menu_7",
    restaurantId: "rest_2",
    categoryId: "cat_4",
    name: "Handi Mutton Korma",
    description: "Slow-cooked mutton in clay handi with rich aromatic Indian spices.",
    price: 450,
    image: "https://images.unsplash.com/photo-1545247181-516773cae76d?q=80&w=600&auto=format&fit=crop",
    foodType: "non-veg",
    tags: { isSpicy: true, isBestseller: true, isTodaySpecial: false },
    inStock: true,
    addons: []
  },
  {
    id: "menu_8",
    restaurantId: "rest_2",
    categoryId: "cat_5",
    name: "Butter Garlic Naan",
    description: "Soft Indian clay-oven bread loaded with pure butter and crushed garlic.",
    price: 60,
    image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?q=80&w=600&auto=format&fit=crop",
    foodType: "veg",
    tags: { isSpicy: false, isBestseller: true, isTodaySpecial: false },
    inStock: true,
    addons: []
  },

  // Green Garden
  {
    id: "menu_9",
    restaurantId: "rest_3",
    categoryId: "cat_6",
    name: "Avocado Quinoa Salad Bowl",
    description: "Premium hass avocado, organic white quinoa, baby spinach, cherry tomatoes, olive oil lime dressing.",
    price: 299,
    discountPrice: 269,
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=600&auto=format&fit=crop",
    foodType: "vegan",
    tags: { isSpicy: false, isBestseller: true, isTodaySpecial: true },
    inStock: true,
    addons: [
      { name: "Extra Avocado Slice", price: 50 },
      { name: "Tofu Cubes", price: 40 }
    ]
  },
  {
    id: "menu_10",
    restaurantId: "rest_3",
    categoryId: "cat_7",
    name: "Berry Green Smoothie",
    description: "Fresh blueberries, local bananas, organic kale, almond milk, and dates nectar.",
    price: 189,
    image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?q=80&w=600&auto=format&fit=crop",
    foodType: "vegan",
    tags: { isSpicy: false, isBestseller: false, isTodaySpecial: false },
    inStock: true,
  },
  {
    id: "menu_11",
    restaurantId: "rest_4",
    categoryId: "cat_8",
    name: "Belgian Chocolate Waffle",
    description: "Crispy dark chocolate waffle base layered with melted white chocolate and milk chocolate curls.",
    price: 180,
    discountPrice: 150,
    image: "https://images.unsplash.com/photo-1562376502-6f769499c886?q=80&w=600&auto=format&fit=crop",
    foodType: "veg",
    tags: { isSpicy: false, isBestseller: true, isTodaySpecial: true },
    inStock: true,
    addons: [
      { name: "Extra Whipped Cream", price: 30 },
      { name: "Vanilla Ice Cream", price: 40 }
    ]
  }
];

export const initialCoupons = [
  { code: "RESTRO100", discountType: "flat", discountValue: 100, minOrderAmount: 499, description: "Flat ₹100 Off on orders above ₹499" },
  { code: "SUPER50", discountType: "percentage", discountValue: 50, minOrderAmount: 200, maxDiscountAmount: 150, description: "50% Off up to ₹150" },
  { code: "FREESHIP", discountType: "flat", discountValue: 39, minOrderAmount: 199, description: "Free delivery discount coupon" }
];

export const initialOrders = [
  {
    id: "ORD_9824",
    restaurantId: "rest_1",
    customerName: "Aarav Sharma",
    customerPhone: "+91 9999888877",
    items: [
      { name: "Margherita Supreme", price: 199, quantity: 2, selectedAddons: [{ name: "Extra Cheese", price: 60 }] }
    ],
    tableNo: "T1",
    subTotal: 518,
    gstAmount: 25.9,
    deliveryCharge: 0,
    totalAmount: 543.9,
    paymentMethod: "razorpay",
    paymentStatus: "paid",
    orderStatus: "preparing",
    createdAt: new Date().toISOString()
  },
  {
    id: "ORD_7712",
    restaurantId: "rest_1",
    customerName: "Sneha Patel",
    customerPhone: "+91 8888777766",
    items: [
      { name: "Hot Chocolate Lava Cake", price: 89, quantity: 1, selectedAddons: [] }
    ],
    tableNo: "",
    subTotal: 89,
    gstAmount: 4.45,
    deliveryCharge: 39,
    totalAmount: 132.45,
    paymentMethod: "cash",
    paymentStatus: "pending",
    orderStatus: "placed",
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString()
  },
  {
    id: "ORD_5431",
    restaurantId: "rest_2",
    customerName: "Rohit Verma",
    customerPhone: "+91 7777666655",
    items: [
      { name: "Shahi Butter Paneer", price: 249, quantity: 1, selectedAddons: [] },
      { name: "Butter Garlic Naan", price: 60, quantity: 2, selectedAddons: [] }
    ],
    tableNo: "B2",
    subTotal: 369,
    gstAmount: 18.45,
    deliveryCharge: 0,
    totalAmount: 387.45,
    paymentMethod: "online",
    paymentStatus: "paid",
    orderStatus: "completed",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
  }
];

export const subscriptionPlans = [
  { id: "free", name: "Free Trial", price: 0, period: "1 Month", features: ["1 Restaurant Profile", "Basic digital menu", "Table QR generator", "Up to 50 orders/mo"] },
  { id: "basic", name: "Premium Pro", price: 1, period: "Month", features: ["Advanced glassmorphic themes", "Realtime order dashboard", "WhatsApp notifications", "Unlimited monthly orders"] }
];
