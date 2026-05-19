import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, ChevronRight, DollarSign, Utensils, Users, X
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

export default function SuperAdminPanel({
  restaurants, setRestaurants, orders, categories, setCategories, coupons, setCoupons, users, setUsers
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddRestModal, setShowAddRestModal] = useState(false);

  // Form states to add restaurant
  const [newRestInput, setNewRestInput] = useState({
    name: '', ownerName: '', email: '', password: '', phone: '', plan: 'free'
  });

  const totalRevenue = useMemo(() => {
    return orders.reduce((sum, o) => sum + o.totalAmount, 0);
  }, [orders]);

  const handleToggleApproveRestaurant = (restId, currentState) => {
    setRestaurants(restaurants.map(r => r.id === restId ? { ...r, isApproved: !currentState } : r));
  };

  const handleToggleActiveRestaurant = (restId, currentState) => {
    setRestaurants(restaurants.map(r => r.id === restId ? { ...r, isActive: !currentState } : r));
  };

  // Create restaurant owner credentials and register a new store node
  const handleRegisterNewRestOwner = (e) => {
    e.preventDefault();
    if (!newRestInput.name || !newRestInput.ownerName || !newRestInput.email || !newRestInput.password) {
      alert("All fields are strictly required.");
      return;
    }

    const matchedUser = users.find(u => u.email.toLowerCase() === newRestInput.email.toLowerCase());
    if (matchedUser) {
      alert("An admin account already exists with this owner email!");
      return;
    }

    const restId = `rest_${Date.now()}`;
    const slug = newRestInput.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');

    // 1. Create Restaurant node
    const newRestaurantNode = {
      id: restId,
      name: newRestInput.name,
      slug: slug,
      logo: "https://img.icons8.com/fluency/196/hamburger.png",
      banner: "https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=1200&auto=format&fit=crop",
      theme: {
        primaryColor: "#ff385c",
        secondaryColor: "#0f172a",
        textColor: "#ffffff",
        styleType: "glassmorphism"
      },
      timings: { open: "09:00", close: "22:00" },
      contact: {
        phone: newRestInput.phone || "+91 9999988888",
        email: newRestInput.email,
        address: "GF, Marketplace Plaza Node, India",
        socialLinks: { instagram: "", facebook: "", whatsapp: "" }
      },
      settings: { gstPercentage: 5, deliveryCharge: 40, minimumOrderAmount: 150 },
      tables: [{ tableNo: "T1", qrCodeUrl: "" }],
      isApproved: true,
      isActive: true,
      rating: 5.0,
      featured: false,
      subscriptionPlan: newRestInput.plan
    };

    // 2. Create Category node
    const newCatNode = {
      id: `cat_${Date.now()}`,
      name: "Fast Foods",
      image: "https://img.icons8.com/fluency/96/pizza.png",
      restaurantId: restId
    };

    // 3. Create User Account Credentials node
    const newUserAccount = {
      email: newRestInput.email,
      password: newRestInput.password,
      role: "restaurant_admin",
      name: newRestInput.ownerName,
      restaurantId: restId
    };

    setRestaurants([...restaurants, newRestaurantNode]);
    setCategories([...categories, newCatNode]);
    setUsers([...users, newUserAccount]);
    setShowAddRestModal(false);
    
    alert(`Successfully registered! Owner can now login using: \nEmail: ${newRestInput.email}\nPassword: ${newRestInput.password}`);
    setNewRestInput({ name: '', ownerName: '', email: '', password: '', phone: '', plan: 'free' });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      <div className="bg-slate-900 border border-white/5 p-6 rounded-3xl flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-white">👑 Main Platform Super Admin Portal</h2>
          <p className="text-xs text-slate-400 mt-0.5">Approve registered restaurant owners, check SaaS transactions, or initialize new tenants</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="space-y-2">
          {[
            { id: 'overview', label: '📊 Platform Overview' },
            { id: 'restaurants', label: '🏪 Registered Restaurants' },
            { id: 'coupons', label: '🎟️ Platform coupons' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left px-5 py-3.5 rounded-2xl font-bold text-xs transition-all flex items-center justify-between ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow shadow-indigo-600/20'
                  : 'bg-slate-900 border border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              <ChevronRight className="w-4 h-4 opacity-60" />
            </button>
          ))}
        </div>

        <div className="lg:col-span-3 space-y-6">
          
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Platform Revenue', count: `₹${Math.round(totalRevenue)}`, desc: 'Paid billing cycles', icon: <DollarSign className="w-5 h-5 text-emerald-400" /> },
                  { label: 'Registered Tenants', count: restaurants.length, desc: 'Active food providers', icon: <Utensils className="w-5 h-5 text-indigo-400" /> },
                  { label: 'Platform Orders', count: orders.length, desc: 'Dining order history', icon: <Users className="w-5 h-5 text-purple-400" /> }
                ].map((stat, i) => (
                  <div key={i} className="bg-slate-900/60 rounded-3xl border border-white/5 p-6 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{stat.label}</span>
                      <h4 className="text-2xl font-black text-white mt-1">{stat.count}</h4>
                      <p className="text-[9px] text-slate-500 mt-0.5">{stat.desc}</p>
                    </div>
                    <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center">
                      {stat.icon}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-white/5 rounded-3xl p-6">
                  <h3 className="text-sm font-bold text-white">Platform Tenant Orders Volume</h3>
                  <div className="h-64 mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={restaurants.map(r => ({
                          name: r.name.substring(0, 8) + '..',
                          orders: orders.filter(o => o.restaurantId === r.id).length
                        }))}
                      >
                        <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                        <YAxis stroke="#64748b" fontSize={9} />
                        <Tooltip />
                        <Bar dataKey="orders" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 flex flex-col justify-center">
                  <h3 className="text-sm font-bold text-white mb-4">SaaS Subscriptions Tiers</h3>
                  <div className="h-56 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Free Trial', value: restaurants.filter(r => r.subscriptionPlan === 'free' || r.subscriptionPlan === 'trial').length },
                            { name: 'Premium Pro', value: restaurants.filter(r => r.subscriptionPlan === 'basic' || r.subscriptionPlan === 'premium').length }
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={65}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {['#64748b', '#bd3838'].map((color, index) => (
                            <Cell key={`cell-${index}`} fill={color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'restaurants' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-white">Registered Restaurants</h3>
                  <p className="text-xs text-slate-400">Total {restaurants.length} store tenants live</p>
                </div>
                <button
                  onClick={() => setShowAddRestModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-4 h-4" />
                  Add Restaurant Owner
                </button>
              </div>

              <div className="bg-slate-900 border border-white/5 rounded-3xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 uppercase font-extrabold tracking-wider border-b border-white/5">
                      <th className="p-4">Brand details</th>
                      <th className="p-4">Owner Email</th>
                      <th className="p-4">Subscription</th>
                      <th className="p-4">Approve Status</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {restaurants.map(rest => (
                      <tr key={rest.id} className="border-b border-white/5 hover:bg-slate-900/60">
                        <td className="p-4 flex items-center gap-3">
                          <img src={rest.logo} alt={rest.name} className="w-10 h-10 rounded-xl object-contain bg-slate-800 p-2" />
                          <div>
                            <span className="font-extrabold text-white text-xs">{rest.name}</span>
                            <span className="text-[10px] text-slate-500 block">/restaurant/{rest.slug}</span>
                          </div>
                        </td>
                        <td className="p-4 text-slate-300">
                          {users.find(u => u.restaurantId === rest.id)?.email || rest.contact.email}
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[9px] rounded uppercase font-bold">
                            {rest.subscriptionPlan}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase text-white ${
                            rest.isApproved ? 'bg-green-600' : 'bg-red-600'
                          }`}>
                            {rest.isApproved ? 'Approved' : 'Pending'}
                          </span>
                        </td>
                        <td className="p-4 text-center space-x-2">
                          <button
                            onClick={() => handleToggleApproveRestaurant(rest.id, rest.isApproved)}
                            className="bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white px-2 py-1 rounded text-[10px] font-bold"
                          >
                            {rest.isApproved ? 'Reject' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleToggleActiveRestaurant(rest.id, rest.isActive)}
                            className="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white px-2 py-1 rounded text-[10px] font-bold"
                          >
                            {rest.isActive ? 'Disable' : 'Enable'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'coupons' && (
            <div className="space-y-6">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Active Global Platform Coupons</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {coupons.map(cop => (
                  <div key={cop.code} className="bg-slate-900 border border-indigo-500/20 rounded-3xl p-5 space-y-3 relative overflow-hidden">
                    <span className="bg-indigo-600 text-white text-[9px] uppercase font-extrabold px-2.5 py-0.5 rounded">
                      Platform Offer
                    </span>
                    <h4 className="text-lg font-black text-yellow-400 pt-2">{cop.code}</h4>
                    <p className="text-xs text-slate-300 font-semibold">{cop.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {showAddRestModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">Register Restaurant Tenant</h3>
                <p className="text-xs text-slate-400">Initialize a new store and create its Admin owner credentials node</p>
              </div>
              <button onClick={() => setShowAddRestModal(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterNewRestOwner} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold uppercase">Restaurant Brand Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Waffle House"
                  className="w-full bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-white"
                  value={newRestInput.name}
                  onChange={(e) => setNewRestInput({ ...newRestInput, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-semibold uppercase">Owner Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Waffle Admin"
                    className="w-full bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-white"
                    value={newRestInput.ownerName}
                    onChange={(e) => setNewRestInput({ ...newRestInput, ownerName: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-semibold uppercase">SaaS Plan Tier</label>
                  <select
                    className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
                    value={newRestInput.plan}
                    onChange={(e) => setNewRestInput({ ...newRestInput, plan: e.target.value })}
                  >
                    <option value="free">Free Trial (₹0 / 1 Month)</option>
                    <option value="basic">Premium Pro (₹999/mo)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-semibold uppercase">Owner Email Login</label>
                  <input
                    type="email"
                    required
                    placeholder="waffle@owner.com"
                    className="w-full bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-white"
                    value={newRestInput.email}
                    onChange={(e) => setNewRestInput({ ...newRestInput, email: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-semibold uppercase">Owner Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Create security password"
                    className="w-full bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-white"
                    value={newRestInput.password}
                    onChange={(e) => setNewRestInput({ ...newRestInput, password: e.target.value })}
                  />
                </div>
              </div>

              <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow">
                Register Tenant & Generate Owner Credentials
              </button>
            </form>
          </div>
        </div>
      )}

    </motion.div>
  );
}
