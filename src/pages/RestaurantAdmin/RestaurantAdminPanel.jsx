import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Trash2, QrCode, Star, ChevronRight, DollarSign, Utensils, X, Edit, Landmark, CreditCard, Percent, Clock, Tv, ExternalLink
} from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { socket, joinRoom } from '../../utils/socket';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';

export default function RestaurantAdminPanel({
  restaurant, categories, setCategories, menus, setMenus, orders, setOrders, t, restaurants, setRestaurants
}) {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Socket.IO real-time kitchen order updates
  useEffect(() => {
    if (!restaurant?.id) return;

    joinRoom(`restaurant_${restaurant.id}`);

    const handleNewOrder = (data) => {
      console.log('📡 Kitchen received new order via socket:', data);
      if (data.order) {
        const formattedOrder = {
          id: data.order._id,
          restaurantId: restaurant.id,
          customerName: data.order.customerName || 'Guest Customer',
          customerPhone: data.order.customerPhone || '+91 99887 76655',
          items: data.order.items.map(item => {
            const resolvedMenu = menus?.find(m => m.id === item.menuItem || m._id === item.menuItem) || { name: item.name || 'Item', price: item.price };
            return {
              id: item.menuItem,
              name: resolvedMenu.name || 'Item',
              price: item.price || resolvedMenu.price || 100,
              quantity: item.quantity,
              selectedAddons: item.selectedAddons || []
            };
          }),
          tableNo: data.order.tableNo || 'T1',
          subTotal: data.order.subTotal,
          gstAmount: data.order.gstAmount,
          deliveryCharge: data.order.deliveryCharge,
          totalAmount: data.order.totalAmount,
          paymentMethod: data.order.paymentMethod,
          paymentStatus: data.order.paymentStatus,
          orderStatus: data.order.orderStatus,
          createdAt: data.order.createdAt
        };

        setOrders(prev => {
          const exists = prev.find(o => o.id === data.order._id);
          if (exists) {
            return prev.map(o => o.id === data.order._id ? formattedOrder : o);
          }
          return [formattedOrder, ...prev];
        });

        // Chime sound notification for kitchen crew
        try {
          const context = new (window.AudioContext || window.webkitAudioContext)();
          const osc = context.createOscillator();
          const gain = context.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, context.currentTime);
          gain.gain.setValueAtTime(0.35, context.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 1.2);
          osc.connect(gain);
          gain.connect(context.destination);
          osc.start();
          osc.stop(context.currentTime + 1.2);
        } catch (soundErr) {
          console.warn("Kitchen chime play failed:", soundErr);
        }
      }
    };

    const handleOrderStatusUpdate = (data) => {
      console.log('📡 Kitchen received order status update via socket:', data);
      if (data.order) {
        setOrders(prev => prev.map(o => o.id === data.order._id ? {
          ...o,
          orderStatus: data.order.orderStatus,
          paymentStatus: data.order.paymentStatus
        } : o));
      }
    };

    socket.on('new_order', handleNewOrder);
    socket.on('order_status_update', handleOrderStatusUpdate);

    return () => {
      socket.off('new_order', handleNewOrder);
      socket.off('order_status_update', handleOrderStatusUpdate);
    };
  }, [restaurant, menus, setOrders]);
  
  // Custom states for CRUD new dishes
  const [showAddDishModal, setShowAddDishModal] = useState(false);
  const [newDish, setNewDish] = useState({
    name: '', description: '', price: '', discountPrice: '', category: '',
    foodType: 'veg', isSpicy: false, isBestseller: false, image: ''
  });

  const [showEditDishModal, setShowEditDishModal] = useState(false);
  const [editDish, setEditDish] = useState(null);

  const [qrTableNoInput, setQrTableNoInput] = useState('');
  const [latestQrCodeGenerated, setLatestQrCodeGenerated] = useState('');
  const [lastGeneratedTableNo, setLastGeneratedTableNo] = useState('');

  const [bankDetails, setBankDetails] = useState({
    bankName: restaurant?.bankDetails?.bankName || '',
    accountHolderName: restaurant?.bankDetails?.accountHolderName || '',
    accountNumber: restaurant?.bankDetails?.accountNumber || '',
    ifscCode: restaurant?.bankDetails?.ifscCode || ''
  });

  const [timings, setTimings] = useState({
    open: restaurant?.timings?.open || '09:00',
    close: restaurant?.timings?.close || '22:00'
  });

  const [settings, setSettings] = useState({
    gstPercentage: restaurant?.settings?.gstPercentage || 5,
    deliveryCharge: restaurant?.settings?.deliveryCharge || 30,
    minimumOrderAmount: restaurant?.settings?.minimumOrderAmount || 99
  });

  useEffect(() => {
    if (restaurant) {
      setBankDetails({
        bankName: restaurant.bankDetails?.bankName || '',
        accountHolderName: restaurant.bankDetails?.accountHolderName || '',
        accountNumber: restaurant.bankDetails?.accountNumber || '',
        ifscCode: restaurant.bankDetails?.ifscCode || ''
      });
      setTimings({
        open: restaurant.timings?.open || '09:00',
        close: restaurant.timings?.close || '22:00'
      });
      setSettings({
        gstPercentage: restaurant.settings?.gstPercentage || 5,
        deliveryCharge: restaurant.settings?.deliveryCharge || 30,
        minimumOrderAmount: restaurant.settings?.minimumOrderAmount || 99
      });
    }
  }, [restaurant]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await apiRequest('/restaurant/profile', {
        method: 'POST',
        body: JSON.stringify({
          name: restaurant.name,
          bankDetails,
          timings,
          settings
        })
      });

      if (res.success && res.restaurant) {
        alert("Settings and Bank Details updated successfully!");
        setRestaurants(restaurants.map(r => (r.id === restaurant.id || r._id === restaurant.id) ? {
          ...r,
          bankDetails: res.restaurant.bankDetails,
          timings: res.restaurant.timings,
          settings: res.restaurant.settings
        } : r));
      } else {
        alert("Failed to save settings: " + (res.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Error saving settings: " + err.message);
    }
  };

  // Scoped metrics
  const localOrders = useMemo(() => {
    return orders.filter(o => o.restaurantId === restaurant.id);
  }, [orders, restaurant]);

  const salesVolume = useMemo(() => {
    return localOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  }, [localOrders]);

  const localMenus = useMemo(() => {
    return menus.filter(m => m.restaurantId === restaurant.id);
  }, [menus, restaurant]);

  const localCategories = useMemo(() => {
    return categories.filter(c => c.restaurantId === restaurant.id);
  }, [categories, restaurant]);

  const [newCatName, setNewCatName] = useState('');
  const [newCatImage, setNewCatImage] = useState('');

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName) return;

    const resolvedImage = newCatImage || 'https://img.icons8.com/color/48/hamburger.png';

    try {
      const res = await apiRequest('/restaurant/categories', {
        method: 'POST',
        body: JSON.stringify({ name: newCatName, image: resolvedImage })
      });
      if (res.success && res.category) {
        const createdCat = {
          id: res.category._id,
          restaurantId: restaurant.id,
          name: res.category.name,
          image: res.category.image
        };
        setCategories([...categories, createdCat]);
        setNewCatName('');
        setNewCatImage('');
      } else {
        alert("Failed to save category to the database.");
      }
    } catch (err) {
      console.error(err);
      alert("Could not save category to the database: " + err.message);
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (!confirm("Are you sure you want to delete this category? All dishes inside it will remain but won't have a scoped category segment.")) return;

    try {
      const res = await apiRequest(`/restaurant/categories/${catId}`, {
        method: 'DELETE'
      });
      if (res.success) {
        setCategories(categories.filter(c => c.id !== catId));
      } else {
        alert("Failed to delete category from the database.");
      }
    } catch (err) {
      console.error(err);
      alert("Could not delete category from the database: " + err.message);
    }
  };

  const handleCreateDishSubmit = async (e) => {
    e.preventDefault();
    if (!newDish.name || !newDish.price) return;

    const resolvedCat = newDish.category || localCategories[0]?.id;
    if (!resolvedCat) {
      alert("Please create at least one category before adding a dish!");
      return;
    }

    try {
      const res = await apiRequest('/restaurant/menu', {
        method: 'POST',
        body: JSON.stringify({
          category: resolvedCat,
          name: newDish.name,
          description: newDish.description,
          price: Number(newDish.price),
          discountPrice: newDish.discountPrice ? Number(newDish.discountPrice) : undefined,
          image: newDish.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop',
          foodType: newDish.foodType,
          tags: { isSpicy: newDish.isSpicy, isBestseller: newDish.isBestseller, isTodaySpecial: false },
        })
      });
      if (res.success && res.menuItem) {
        const createdItem = {
          id: res.menuItem._id,
          restaurantId: restaurant.id,
          categoryId: res.menuItem.category,
          name: res.menuItem.name,
          description: res.menuItem.description,
          price: res.menuItem.price,
          discountPrice: res.menuItem.discountPrice || null,
          image: res.menuItem.image,
          foodType: res.menuItem.foodType,
          tags: res.menuItem.tags,
          inStock: res.menuItem.inStock,
          addons: res.menuItem.addons || []
        };
        setMenus([createdItem, ...menus]);
        setShowAddDishModal(false);
        setNewDish({ name: '', description: '', price: '', discountPrice: '', category: '', foodType: 'veg', isSpicy: false, isBestseller: false, image: '' });
      } else {
        alert("Failed to save menu item to the database.");
      }
    } catch (err) {
      console.error(err);
      alert("Could not save menu item to the database: " + err.message);
    }
  };

  const handleEditDishSubmit = async (e) => {
    e.preventDefault();
    if (!editDish || !editDish.name || !editDish.price) return;

    try {
      const res = await apiRequest(`/restaurant/menu/${editDish.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          category: editDish.categoryId,
          name: editDish.name,
          description: editDish.description,
          price: Number(editDish.price),
          discountPrice: editDish.discountPrice ? Number(editDish.discountPrice) : undefined,
          foodType: editDish.foodType,
          tags: { isSpicy: editDish.isSpicy, isBestseller: editDish.isBestseller, isTodaySpecial: false },
          image: editDish.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop'
        })
      });
      if (res.success && res.menuItem) {
        setMenus(menus.map(m => m.id === editDish.id ? {
          id: res.menuItem._id,
          restaurantId: restaurant.id,
          categoryId: res.menuItem.category,
          name: res.menuItem.name,
          description: res.menuItem.description,
          price: res.menuItem.price,
          discountPrice: res.menuItem.discountPrice || null,
          image: res.menuItem.image,
          foodType: res.menuItem.foodType,
          tags: res.menuItem.tags,
          inStock: res.menuItem.inStock,
          addons: res.menuItem.addons || []
        } : m));
        setShowEditDishModal(false);
        setEditDish(null);
      } else {
        alert("Failed to save edited menu item to the database.");
      }
    } catch (err) {
      console.error(err);
      alert("Could not save edited menu item to the database: " + err.message);
    }
  };

  const handleDeleteDish = async (itemId) => {
    if (!confirm("Are you sure you want to delete this menu dish?")) return;

    try {
      const res = await apiRequest(`/restaurant/menu/${itemId}`, {
        method: 'DELETE'
      });
      if (res.success) {
        setMenus(menus.filter(m => m.id !== itemId));
      } else {
        alert("Failed to delete menu item from the database.");
      }
    } catch (err) {
      console.error(err);
      alert("Could not delete menu item from the database: " + err.message);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await apiRequest(`/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ orderStatus: newStatus })
      });
    } catch (err) {
      console.warn("Could not sync order status to backend MongoDB. Syncing locally:", err.message);
    }
    
    setOrders(orders.map(o => o.id === orderId ? { ...o, orderStatus: newStatus } : o));
  };

  const handleGenerateTableQR = async (e) => {
    e.preventDefault();
    if (!qrTableNoInput) return;

    const targetUrl = window.location.origin + `/restaurant/${restaurant.slug}?table=${qrTableNoInput}`;
    let resolvedQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(targetUrl)}`;

    try {
      const res = await apiRequest(`/restaurant/tables/${qrTableNoInput}/qr`, {
        method: 'POST',
        body: JSON.stringify({ targetUrl })
      });
      if (res.success && res.qrCodeUrl) {
        resolvedQrCodeUrl = res.qrCodeUrl;
      }
    } catch (err) {
      console.warn("Could not generate QR code on the backend MongoDB. Syncing standard fallback QR:", err.message);
    }

    const exists = (restaurant.tables || []).find(t => t.tableNo === qrTableNoInput);
    if (!exists) {
      setRestaurants(restaurants.map(r => (r.id === restaurant.id || r._id === restaurant.id || r._id === restaurant._id) ? {
        ...r,
        tables: [...(r.tables || []), { tableNo: qrTableNoInput, qrCodeUrl: resolvedQrCodeUrl }]
      } : r));
    }
    
    setLatestQrCodeGenerated(resolvedQrCodeUrl);
    setLastGeneratedTableNo(qrTableNoInput);
    setQrTableNoInput('');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Premium Banner Hero Header */}
      <div className="relative h-48 rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
        {/* Background Banner Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${restaurant.banner || 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=1200&auto=format&fit=crop'})` }}
        />
        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/65 to-slate-950/20 z-0"></div>
        
        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 flex gap-4 items-end z-10">
          <img 
            src={restaurant.logo} 
            alt={restaurant.name} 
            className="w-16 h-16 rounded-2xl object-contain bg-slate-900/90 p-2 border border-white/10 shadow-lg shadow-black/40 backdrop-blur-sm" 
          />
          <div className="space-y-1 text-left">
            <span className="inline-flex items-center gap-1 bg-red-500/20 border border-red-500/30 text-red-400 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
              Restaurant Scoped Admin Node
            </span>
            <h2 className="text-2xl font-black text-white drop-shadow-md leading-tight">
              {restaurant.name} Catalog Portal
            </h2>
            <p className="text-xs text-slate-300 font-medium opacity-90 drop-shadow-sm">
              Post foods, custom timings settings, table QRs, and track local customer orders
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="space-y-2">
          {[
            { id: 'dashboard', label: '📊 Scoped Metrics' },
            { id: 'menu', label: '🍕 Food Catalog Posts' },
            { id: 'orders', label: '📥 Orders Dashboard' },
            { id: 'qr', label: '🖨️ QR Table codes' },
            { id: 'settings', label: '⚙️ Settings & Bank' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left px-5 py-3.5 rounded-2xl font-bold text-xs transition-all flex items-center justify-between ${
                activeTab === tab.id
                  ? 'bg-red-500 text-white shadow shadow-red-500/20'
                  : 'bg-slate-900 border border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              <ChevronRight className="w-4 h-4 opacity-60" />
            </button>
          ))}

          <a
            href={`/queue/${restaurant.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full text-left px-5 py-3.5 rounded-2xl font-bold text-xs bg-slate-900/60 border border-emerald-500/20 hover:border-emerald-500/50 text-emerald-400 hover:text-emerald-300 transition-all flex items-center justify-between mt-4 shadow-sm"
          >
            <span className="flex items-center gap-2">
              <Tv className="w-4 h-4 text-emerald-400 animate-pulse" />
              📺 Lobby Queue TV
            </span>
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </a>
        </div>

        <div className="lg:col-span-3 space-y-6">
          
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Your Orders count', count: localOrders.length, desc: 'Total dining backlog', icon: <Utensils className="w-5 h-5 text-indigo-400" /> },
                  { label: 'Restaurant Sales', count: `₹${Math.round(salesVolume)}`, desc: 'Paid gross earnings', icon: <DollarSign className="w-5 h-5 text-emerald-400" /> },
                  { label: 'Current Ratings', count: restaurant.rating, desc: 'Customer stars average', icon: <Star className="w-5 h-5 text-amber-400 fill-amber-400" /> }
                ].map((c, i) => (
                  <div key={i} className="bg-slate-900/60 rounded-3xl border border-white/5 p-6 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{c.label}</span>
                      <h4 className="text-2xl font-black text-white mt-1">{c.count}</h4>
                      <p className="text-[9px] text-slate-500 mt-0.5">{c.desc}</p>
                    </div>
                    <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center">
                      {c.icon}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-slate-900 border border-white/5 rounded-3xl p-6">
                <h3 className="text-base font-bold text-white">Live Performance Chart</h3>
                <div className="h-64 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={[
                        { name: 'Week 1', sales: salesVolume * 0.15 },
                        { name: 'Week 2', sales: salesVolume * 0.3 },
                        { name: 'Week 3', sales: salesVolume * 0.4 },
                        { name: 'Week 4', sales: salesVolume * 0.15 }
                      ]}
                    >
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <Tooltip />
                      <Area type="monotone" dataKey="sales" stroke="#ff385c" fill="rgba(255, 56, 92, 0.1)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'menu' && (
            <div className="space-y-6">
              {/* Category Manager Section */}
              <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 space-y-4 text-left">
                <div>
                  <h4 className="text-sm font-extrabold text-white">Category Manager</h4>
                  <p className="text-[10px] text-slate-400">Create new segments to organize your dishes catalog</p>
                </div>
                <form onSubmit={handleCreateCategory} className="flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-[200px] space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Category Name</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Desserts" 
                      className="w-full bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl text-xs focus:outline-none focus:border-red-500 text-white"
                      value={newCatName}
                      onChange={e => setNewCatName(e.target.value)}
                    />
                  </div>
                  <div className="flex-1 min-w-[200px] space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Category Image URL (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="https://img.icons8.com/color/48/ice-cream.png" 
                      className="w-full bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl text-xs focus:outline-none focus:border-red-500 text-white"
                      value={newCatImage}
                      onChange={e => setNewCatImage(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="py-2.5 px-5 bg-gradient-to-r from-red-500 to-orange-500 text-white font-extrabold text-xs rounded-xl shadow transition hover:scale-[1.02]">
                    Create Category
                  </button>
                </form>
                {/* List of active categories */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {localCategories.map(cat => (
                    <div key={cat.id} className="bg-slate-950 border border-white/5 rounded-xl px-3 py-1.5 flex items-center gap-2 text-[10px] font-bold text-slate-300">
                      {cat.image && <img src={cat.image} className="w-3.5 h-3.5 object-contain" alt="" />}
                      <span>{cat.name}</span>
                      <button 
                        type="button" 
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="text-red-500 hover:text-red-400 font-bold ml-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-white">Menu Dishes Posted</h3>
                  <p className="text-xs text-slate-400">Total {localMenus.length} items live under {localCategories.length} categories</p>
                </div>
                <button
                  onClick={() => setShowAddDishModal(true)}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-4 h-4" />
                  Post New Food Dish
                </button>
              </div>

              <div className="bg-slate-900 border border-white/5 rounded-3xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 uppercase font-extrabold tracking-wider border-b border-white/5">
                      <th className="p-4">Dish details</th>
                      <th className="p-4">Diet Type</th>
                      <th className="p-4">Price</th>
                      <th className="p-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {localMenus.map(m => (
                      <tr key={m.id} className="border-b border-white/5 hover:bg-slate-900/60">
                        <td className="p-4 flex items-center gap-3">
                          <img src={m.image} alt={m.name} className="w-10 h-10 rounded-xl object-cover" />
                          <div>
                            <span className="font-extrabold text-white text-xs">{m.name}</span>
                            <p className="text-[10px] text-slate-500 truncate max-w-[250px]">{m.description}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[8px] uppercase font-bold text-white ${
                            m.foodType === 'veg' ? 'bg-green-600' : m.foodType === 'non-veg' ? 'bg-red-600' : 'bg-emerald-600'
                          }`}>
                            {m.foodType}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-slate-200">₹{m.price}</td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setEditDish({
                                  id: m.id,
                                  name: m.name,
                                  description: m.description,
                                  price: m.price,
                                  discountPrice: m.discountPrice || '',
                                  categoryId: m.categoryId,
                                  foodType: m.foodType,
                                  isSpicy: m.tags?.isSpicy || false,
                                  isBestseller: m.tags?.isBestseller || false,
                                  image: m.image
                                });
                                setShowEditDishModal(true);
                              }}
                              className="p-1.5 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white rounded-xl transition"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteDish(m.id)}
                              className="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-xl transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white">Customer Orders</h3>
                <p className="text-xs text-slate-400">Total {localOrders.length} records retrieved</p>
              </div>

              {localOrders.length === 0 ? (
                <div className="text-center py-16 bg-slate-900 rounded-3xl p-4">
                  <p className="text-xs text-slate-400">No dining orders active</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {localOrders.map(ord => (
                    <div key={ord.id} className="bg-slate-900 border border-white/5 rounded-3xl p-5 space-y-4">
                      <div className="flex justify-between items-start pb-3 border-b border-white/5 text-xs">
                        <div>
                          <span className="font-extrabold text-white text-sm">Order {ord.id}</span>
                          {ord.tableNo && <span className="bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded ml-2">Table {ord.tableNo}</span>}
                        </div>
                        <select
                          className="bg-slate-800 border border-slate-700 text-slate-200 text-[10px] font-bold rounded-lg px-2.5 py-1 focus:outline-none"
                          value={ord.orderStatus}
                          onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                        >
                          <option value="placed">Placed 📥</option>
                          <option value="preparing">Preparing 🍳</option>
                          <option value="ready">Ready 🛵</option>
                          <option value="completed">Completed ✓</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        {ord.items.map((i, k) => (
                          <div key={k} className="flex justify-between text-xs text-slate-300">
                            <span>{i.name} x{i.quantity}</span>
                            <span className="font-bold">₹{i.price * i.quantity}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-3 border-t border-white/5 flex justify-between text-xs text-slate-400">
                        <span>Customer: {ord.customerName}</span>
                        <span>Grand Total: <strong className="text-red-400">₹{ord.totalAmount}</strong> ({ord.paymentStatus})</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'qr' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white">Table QR Codes Generator</h3>
                <p className="text-xs text-slate-400">Compile instant dine-in table QR ordering link graphics</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 space-y-4">
                  <form onSubmit={handleGenerateTableQR} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 font-semibold uppercase">Table Number</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. T4"
                        className="w-full bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-red-500 text-white"
                        value={qrTableNoInput}
                        onChange={(e) => setQrTableNoInput(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="w-full py-3 bg-red-500 text-white font-bold text-xs rounded-xl shadow">
                      Generate QR Code
                    </button>
                  </form>
                </div>

                <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center min-h-[250px]">
                  {latestQrCodeGenerated ? (
                    <div className="space-y-4 text-center">
                      <div className="bg-white p-4 rounded-2xl inline-block">
                        <img src={latestQrCodeGenerated} alt="Table QR" className="w-36 h-36" />
                      </div>
                      <span className="bg-indigo-600 text-white text-[9px] uppercase font-extrabold px-2 py-0.5 rounded block">
                        Table {lastGeneratedTableNo} Active
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">Fill left form fields to compile printable table QR</p>
                  )}
                </div>
              </div>

              {/* Active Tables Grid directory */}
              <div className="space-y-4 pt-6 border-t border-white/5">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Active Dining Tables QR Directory</span>
                  <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-black uppercase tracking-wide">
                    {(restaurant.tables || []).length} Tables Provisioned
                  </span>
                </h4>
                
                {(restaurant.tables && restaurant.tables.length > 0) ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {restaurant.tables.map((t, idx) => {
                      const tableUrl = `${window.location.origin}/restaurant/${restaurant.slug}?table=${t.tableNo}`;
                      return (
                        <div key={idx} className="bg-slate-900 border border-white/5 hover:border-red-500/30 rounded-3xl p-4 flex flex-col items-center gap-3 transition group relative">
                          <span className="absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                            Table {t.tableNo}
                          </span>
                          
                          <div className="bg-white p-3 rounded-2xl mt-4">
                            <img src={t.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(tableUrl)}`} alt={`Table ${t.tableNo} QR`} className="w-24 h-24 object-contain" />
                          </div>
                          
                          <div className="flex flex-col gap-1 w-full text-center">
                            <a 
                              href={tableUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-[10px] text-red-400 hover:text-red-300 font-bold underline truncate block"
                            >
                              Open Order Link
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(tableUrl);
                                alert(`Table ${t.tableNo} link copied to clipboard!`);
                              }}
                              className="text-[9px] text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 py-1 px-2.5 rounded-lg font-bold transition mt-1"
                            >
                              Copy Link
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-slate-900/50 border border-dashed border-white/10 rounded-3xl">
                    <p className="text-xs text-slate-500">No active tables found. Generate your first table QR code above to populate the directory!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white">Restaurant Settings & Bank Details</h3>
                <p className="text-xs text-slate-400 font-medium">Configure your operations, taxes, and bank details for automated payouts.</p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-6 text-left">
                {/* 1. General & Operating Settings */}
                <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 space-y-4">
                  <h4 className="text-sm font-extrabold text-white flex items-center gap-2 pb-2 border-b border-white/5">
                    <Clock className="w-4 h-4 text-red-500" />
                    Operating Timings & Fees
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Opening Time</label>
                      <input 
                        type="time" 
                        required 
                        className="w-full bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-red-500 text-white font-bold"
                        value={timings.open}
                        onChange={e => setTimings({ ...timings, open: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Closing Time</label>
                      <input 
                        type="time" 
                        required 
                        className="w-full bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-red-500 text-white font-bold"
                        value={timings.close}
                        onChange={e => setTimings({ ...timings, close: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">GST Tax (%)</label>
                      <input 
                        type="number" 
                        required 
                        min="0"
                        max="30"
                        className="w-full bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-red-500 text-white font-bold"
                        value={settings.gstPercentage}
                        onChange={e => setSettings({ ...settings, gstPercentage: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Delivery Charge (₹)</label>
                      <input 
                        type="number" 
                        required 
                        min="0"
                        className="w-full bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-red-500 text-white font-bold"
                        value={settings.deliveryCharge}
                        onChange={e => setSettings({ ...settings, deliveryCharge: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Minimum Order Amount (₹)</label>
                      <input 
                        type="number" 
                        required 
                        min="0"
                        className="w-full bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-red-500 text-white font-bold"
                        value={settings.minimumOrderAmount}
                        onChange={e => setSettings({ ...settings, minimumOrderAmount: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Bank Details */}
                <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 space-y-4">
                  <h4 className="text-sm font-extrabold text-white flex items-center gap-2 pb-2 border-b border-white/5">
                    <Landmark className="w-4 h-4 text-emerald-500" />
                    Razorpay Connected Payout Bank Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Account Holder Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. John Doe"
                        className="w-full bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-emerald-500 text-white font-bold"
                        value={bankDetails.accountHolderName}
                        onChange={e => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Bank Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. HDFC Bank"
                        className="w-full bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-emerald-500 text-white font-bold"
                        value={bankDetails.bankName}
                        onChange={e => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Bank Account Number</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 50100234567890"
                        className="w-full bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-emerald-500 text-white font-bold"
                        value={bankDetails.accountNumber}
                        onChange={e => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Bank IFSC Code</label>
                      <input 
                        type="text" 
                        placeholder="e.g. HDFC0000123"
                        className="w-full bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-emerald-500 text-white font-bold"
                        value={bankDetails.ifscCode}
                        onChange={e => setBankDetails({ ...bankDetails, ifscCode: e.target.value.toUpperCase() })}
                      />
                    </div>
                  </div>
                  <div className="bg-emerald-950/20 border border-emerald-500/25 rounded-2xl p-4 flex gap-3 text-[10px]">
                    <CreditCard className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <p className="text-slate-300">These details will be used to automatically process payments routed through Razorpay directly into the bank account within T+2 days.</p>
                  </div>
                </div>

                {/* Save button */}
                <div className="flex justify-end">
                  <button 
                    type="submit" 
                    className="py-3 px-8 bg-gradient-to-r from-red-500 to-orange-500 text-white font-extrabold text-xs rounded-xl shadow transition hover:scale-[1.02]"
                  >
                    Save Configuration Settings
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>

      {showAddDishModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">Post New Dish</h3>
                <p className="text-xs text-slate-400">Add food items, description details, and configure price parameters</p>
              </div>
              <button onClick={() => setShowAddDishModal(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDishSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold uppercase">Dish Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Classic Cheese Crust Burger"
                  className="w-full bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-red-500 text-white"
                  value={newDish.name}
                  onChange={(e) => setNewDish({ ...newDish, name: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold uppercase">Description Summary</label>
                <textarea
                  required
                  placeholder="Baking styles, toppings, cheese layers details..."
                  rows="2"
                  className="w-full bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl text-xs focus:outline-none focus:border-red-500 text-white resize-none"
                  value={newDish.description}
                  onChange={(e) => setNewDish({ ...newDish, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-semibold uppercase">Regular Price (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="250"
                    className="w-full bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-red-500 text-white"
                    value={newDish.price}
                    onChange={(e) => setNewDish({ ...newDish, price: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-semibold uppercase">Category Segment</label>
                  <select
                    className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
                    value={newDish.category}
                    onChange={(e) => setNewDish({ ...newDish, category: e.target.value })}
                  >
                    {localCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-semibold uppercase">Diet Type</label>
                  <select
                    className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
                    value={newDish.foodType}
                    onChange={(e) => setNewDish({ ...newDish, foodType: e.target.value })}
                  >
                    <option value="veg">Veg 🌱</option>
                    <option value="non-veg">Non-Veg 🍗</option>
                    <option value="vegan">Vegan 🥑</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-semibold uppercase">Dish Image URL</label>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com..."
                    className="w-full bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-red-500 text-white"
                    value={newDish.image}
                    onChange={(e) => setNewDish({ ...newDish, image: e.target.value })}
                  />
                </div>
              </div>

              <button type="submit" className="w-full py-3 bg-red-500 text-white font-bold text-xs rounded-xl shadow">
                Post Dish to Menu
              </button>
            </form>
          </div>
        </div>
      )}

      {showEditDishModal && editDish && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white">Edit Dish Details</h3>
                <p className="text-xs text-slate-400">Modify title, pricing parameters, or customize item food image</p>
              </div>
              <button onClick={() => { setShowEditDishModal(false); setEditDish(null); }} className="text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Image Preview */}
            <div className="relative h-36 rounded-2xl overflow-hidden bg-slate-950 border border-white/5 flex items-center justify-center">
              {editDish.image ? (
                <img src={editDish.image} alt="Dish Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-slate-500">Image Preview Placeholder</span>
              )}
              <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm border border-white/10 px-2.5 py-0.5 rounded-full text-[9px] uppercase font-bold text-white">
                Live Image Preview
              </div>
            </div>

            <form onSubmit={handleEditDishSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold uppercase">Dish Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Classic Cheese Crust Burger"
                  className="w-full bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-red-500 text-white"
                  value={editDish.name}
                  onChange={(e) => setEditDish({ ...editDish, name: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold uppercase">Description Summary</label>
                <textarea
                  required
                  placeholder="Baking styles, toppings, cheese layers details..."
                  rows="2"
                  className="w-full bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl text-xs focus:outline-none focus:border-red-500 text-white resize-none"
                  value={editDish.description}
                  onChange={(e) => setEditDish({ ...editDish, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-semibold uppercase">Regular Price (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="250"
                    className="w-full bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-red-500 text-white"
                    value={editDish.price}
                    onChange={(e) => setEditDish({ ...editDish, price: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-semibold uppercase">Category Segment</label>
                  <select
                    className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
                    value={editDish.categoryId}
                    onChange={(e) => setEditDish({ ...editDish, categoryId: e.target.value })}
                  >
                    {localCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-semibold uppercase">Diet Type</label>
                  <select
                    className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
                    value={editDish.foodType}
                    onChange={(e) => setEditDish({ ...editDish, foodType: e.target.value })}
                  >
                    <option value="veg">Veg 🌱</option>
                    <option value="non-veg">Non-Veg 🍗</option>
                    <option value="vegan">Vegan 🥑</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-semibold uppercase">Dish Image URL</label>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com..."
                    className="w-full bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-red-500 text-white"
                    value={editDish.image}
                    onChange={(e) => setEditDish({ ...editDish, image: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  type="button" 
                  onClick={() => { setShowEditDishModal(false); setEditDish(null); }}
                  className="flex-1 py-3 bg-slate-800 border border-white/5 text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </motion.div>
  );
}
