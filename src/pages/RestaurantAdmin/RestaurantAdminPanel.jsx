import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Trash2, QrCode, Star, ChevronRight, DollarSign, Utensils, X, Edit, Landmark, CreditCard, Percent, Clock, Tv, ExternalLink,
  BarChart3, Pizza, ClipboardList, Settings, Sparkles, Check
} from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { SUBSCRIPTION_MONTHLY_PRICE_INR, SUBSCRIPTION_MONTHLY_PRICE_PAISE } from '../../config/subscription';
import { socket, joinRoom } from '../../utils/socket';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';

const HYD_AREAS = [
  "Uppal", "Secunderabad", "Banjara Hills", "Jubilee Hills", 
  "Gachibowli", "Madhapur", "Begumpet", "Khairatabad", 
  "Abids", "Kondapur", "Charminar", "Kukatpally", 
  "Dilsukhnagar", "Mehdipatnam", "Hitech City", "Nampally", "Habsiguda"
];

export default function RestaurantAdminPanel({
  restaurant, categories, setCategories, menus, setMenus, orders, setOrders, t, restaurants, setRestaurants
}) {
  const [activeTab, setActiveTab] = useState('dashboard');

  const isSubscriptionExpired = useMemo(() => {
    if (!restaurant) return false;
    if (restaurant.subscriptionActive === false) return true;
    if (restaurant.subscriptionExpiry) {
      return new Date(restaurant.subscriptionExpiry) < new Date();
    }
    return false;
  }, [restaurant]);

  const [timeLeftStr, setTimeLeftStr] = useState('');
  const [renewing, setRenewing] = useState(false);

  useEffect(() => {
    if (!restaurant || !restaurant.subscriptionExpiry || isSubscriptionExpired) {
      setTimeLeftStr('');
      return;
    }

    const updateTimer = () => {
      const expiry = new Date(restaurant.subscriptionExpiry).getTime();
      const now = new Date().getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeftStr('Expired');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (restaurant.subscriptionPlan === 'free') {
        if (days > 0) {
          setTimeLeftStr(`${days}d ${hours}h ${minutes}m ${seconds}s left`);
        } else {
          setTimeLeftStr(`${hours}h ${minutes}m ${seconds}s left`);
        }
      } else {
        if (days > 0) {
          setTimeLeftStr(`${days} days remaining`);
        } else {
          setTimeLeftStr(`${hours} hours remaining`);
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [restaurant, isSubscriptionExpired]);

  const handleRenewSubscription = async () => {
    setRenewing(true);
    try {
      const rzRes = await apiRequest('/payments/create-order', {
        method: 'POST',
        body: JSON.stringify({
          amount: SUBSCRIPTION_MONTHLY_PRICE_PAISE,
          currency: 'INR',
          receipt: `sub_renew_${restaurant.id}_${Date.now().toString().slice(-4)}`
        })
      });

      if (!rzRes.success) {
        throw new Error(rzRes.error || "Failed to initialize payment gateway order");
      }

      // 2. Check if sandbox/mock mode is active
      if (rzRes.isMock) {
        const confirmSimulate = confirm(`Sandbox Mode Active: Simulating secure Razorpay settlement.\n\nClick OK to authorize the ₹${SUBSCRIPTION_MONTHLY_PRICE_INR}.00 (${SUBSCRIPTION_MONTHLY_PRICE_PAISE} paise) payment simulation and extend your Premium Pro subscription by 30 days.`);
        if (!confirmSimulate) {
          setRenewing(false);
          return;
        }

        // Call backend verification with simulated credentials
        const mockOrderId = rzRes.order_id || `order_mock_${Math.random().toString(36).substring(2, 10)}`;
        const mockPayId = `pay_mock_${Math.random().toString(36).substring(2, 10)}`;

        const verifyRes = await apiRequest('/payments/verify', {
          method: 'POST',
          body: JSON.stringify({
            isMock: true,
            razorpay_order_id: mockOrderId,
            razorpay_payment_id: mockPayId,
            razorpay_signature: 'mock_signature'
          })
        });

        if (!verifyRes.success) {
          throw new Error("Mock payment verification failed on the server.");
        }

        // Finally, call the actual renew endpoint to extend in database
        const renewRes = await apiRequest('/restaurant/subscription/renew', {
          method: 'POST'
        });

        if (renewRes.success && renewRes.restaurant) {
          alert('Subscription successfully renewed for 1 month via Sandbox Payment simulation! All dashboard services are now reactivated.');
          setRestaurants(restaurants.map(r => (r.id === restaurant.id || r._id === restaurant.id) ? {
            ...r,
            subscriptionPlan: renewRes.restaurant.subscriptionPlan,
            subscriptionExpiry: renewRes.restaurant.subscriptionExpiry,
            subscriptionActive: renewRes.restaurant.subscriptionActive,
            isActive: renewRes.restaurant.isActive
          } : r));
        } else {
          throw new Error(renewRes.error || 'Renewal failed after payment verification');
        }
        return;
      }

      // 3. Real Razorpay Checkout flow (VITE_RAZORPAY_KEY_ID or fallback)
      const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_your_key';
      
      const options = {
        key: keyId,
        amount: rzRes.amount,
        currency: rzRes.currency || 'INR',
        name: restaurant.name || 'Orderin SaaS',
        description: 'Premium Pro 1-Month Plan Renewal',
        order_id: rzRes.id,
        image: "https://img.icons8.com/fluency/196/hamburger.png",
        handler: async function (response) {
          setRenewing(true);
          try {
            // Verify payment on backend
            const verifyRes = await apiRequest('/payments/verify', {
              method: 'POST',
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                isMock: false
              })
            });

            if (!verifyRes.success) {
              alert("Payment verification failed on server.");
              setRenewing(false);
              return;
            }

            // Finally call actual renew endpoint to extend database subscription
            const renewRes = await apiRequest('/restaurant/subscription/renew', {
              method: 'POST'
            });

            if (renewRes.success && renewRes.restaurant) {
              alert('Subscription successfully renewed for 1 month! All premium services are active.');
              setRestaurants(restaurants.map(r => (r.id === restaurant.id || r._id === restaurant.id) ? {
                ...r,
                subscriptionPlan: renewRes.restaurant.subscriptionPlan,
                subscriptionExpiry: renewRes.restaurant.subscriptionExpiry,
                subscriptionActive: renewRes.restaurant.subscriptionActive,
                isActive: renewRes.restaurant.isActive
              } : r));
            } else {
              alert("Failed to extend subscription: " + (renewRes.error || "Unknown error"));
            }
          } catch (err) {
            alert("Verification and renewal failed: " + err.message);
          } finally {
            setRenewing(false);
          }
        },
        prefill: {
          name: restaurant.ownerName || "",
          email: restaurant.email || "",
          contact: restaurant.phone || ""
        },
        theme: {
          color: "#ff385c"
        },
        modal: {
          ondismiss: function () {
            setRenewing(false);
          }
        }
      };

      if (!window.Razorpay) {
        throw new Error("Razorpay Checkout SDK is not loaded. Please inspect your internet connection.");
      }

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      alert('Error during subscription renewal process: ' + err.message);
    } finally {
      // Clean up renewing state if SDK fails to open or mock is processed
      if (!window.Razorpay || !rzRes?.success || rzRes.isMock) {
        setRenewing(false);
      }
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

  const itemSalesStats = useMemo(() => {
    const stats = {};
    localOrders.forEach(order => {
      const isActiveOrder = ['paid', 'PAID', 'completed', 'preparing', 'ready', 'placed'].includes(order.orderStatus) || ['paid', 'PAID', 'success'].includes(order.paymentStatus);
      if (!isActiveOrder) return;
      
      order.items.forEach(item => {
        const name = item.name || 'Unknown Item';
        if (!stats[name]) {
          stats[name] = {
            name,
            quantity: 0,
            revenue: 0
          };
        }
        stats[name].quantity += item.quantity || 1;
        stats[name].revenue += (item.price || 0) * (item.quantity || 1);
      });
    });
    return Object.values(stats).sort((a, b) => b.quantity - a.quantity);
  }, [localOrders]);

  const todayBestseller = useMemo(() => {
    const stats = {};
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    
    localOrders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      if (orderDate < startOfToday) return;
      
      const isActiveOrder = ['paid', 'PAID', 'completed', 'preparing', 'ready', 'placed'].includes(order.orderStatus) || ['paid', 'PAID', 'success'].includes(order.paymentStatus);
      if (!isActiveOrder) return;
      
      order.items.forEach(item => {
        const name = item.name || 'Unknown Item';
        if (!stats[name]) {
          stats[name] = {
            name,
            quantity: 0
          };
        }
        stats[name].quantity += item.quantity || 1;
      });
    });
    
    const sorted = Object.values(stats).sort((a, b) => b.quantity - a.quantity);
    return sorted[0] || null;
  }, [localOrders]);

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
          createdAt: data.order.createdAt,
          orderType: data.order.orderType || 'table',
          pickupTime: data.order.pickupTime || '',
          pickupCode: data.order.pickupCode || '',
          preparationStatus: data.order.preparationStatus || 'Pending',
          routeFrom: data.order.routeFrom || '',
          routeTo: data.order.routeTo || '',
          routeETA: data.order.routeETA || ''
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

  const [ownerName, setOwnerName] = useState(restaurant?.ownerName || '');
  const [businessEmail, setBusinessEmail] = useState(restaurant?.email || '');
  const [businessPhone, setBusinessPhone] = useState(restaurant?.phone || '');
  const [panNumber, setPanNumber] = useState(restaurant?.panNumber || '');
  const [gstNumber, setGstNumber] = useState(restaurant?.gstNumber || '');
  const [businessAddress, setBusinessAddress] = useState(restaurant?.address || '');

  const [logo, setLogo] = useState(restaurant?.logo || '');
  const [banner, setBanner] = useState(restaurant?.banner || '');
  const [tagline, setTagline] = useState(restaurant?.tagline || '');
  const [isEditingTagline, setIsEditingTagline] = useState(false);
  const [taglineInput, setTaglineInput] = useState(restaurant?.tagline || '');

  const [kycStatus, setKycStatus] = useState(restaurant?.kycStatus || 'pending');
  const [settlementStatus, setSettlementStatus] = useState(restaurant?.settlementStatus || 'suspended');
  const [razorpayAccountId, setRazorpayAccountId] = useState(restaurant?.razorpayAccountId || '');
  const [commissionPercent, setCommissionPercent] = useState(restaurant?.commissionPercent || 10);
  const [kycDoc, setKycDoc] = useState(null);

  // File upload states
  const [panCardFile, setPanCardFile] = useState(null);
  const [gstCertificateFile, setGstCertificateFile] = useState(null);
  const [bankProofFile, setBankProofFile] = useState(null);
  const [aadhaarFile, setAadhaarFile] = useState(null);

  // Settlement & Payout collections
  const [settlements, setSettlements] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalSales: 0,
    restaurantShare: 0,
    platformCommission: 0,
    settledToBank: 0,
    failedTransfersCount: 0,
    pendingSettlements: 0
  });

  const [registeringVendor, setRegisteringVendor] = useState(false);

  const [timings, setTimings] = useState({
    open: restaurant?.timings?.open || '09:00',
    close: restaurant?.timings?.close || '22:00'
  });

  const [settings, setSettings] = useState({
    gstPercentage: restaurant?.settings?.gstPercentage || 5,
    deliveryCharge: restaurant?.settings?.deliveryCharge || 30,
    minimumOrderAmount: restaurant?.settings?.minimumOrderAmount || 99
  });

  const fetchKycAndSettlementData = async () => {
    try {
      const res = await apiRequest('/restaurant/kyc/status');
      if (res.success) {
        setKycStatus(res.kycStatus || 'pending');
        setSettlementStatus(res.settlementStatus || 'suspended');
        setRazorpayAccountId(res.razorpayAccountId || '');
        setBankDetails(res.bankDetails || { bankName: '', accountHolderName: '', accountNumber: '', ifscCode: '' });
        setOwnerName(res.businessDetails?.ownerName || '');
        setBusinessEmail(res.businessDetails?.email || '');
        setBusinessPhone(res.businessDetails?.phone || '');
        setPanNumber(res.businessDetails?.panNumber || '');
        setGstNumber(res.businessDetails?.gstNumber || '');
        setBusinessAddress(res.businessDetails?.address || '');
        setKycDoc(res.kycDocument);
      }

      // Fetch analytics
      const analyticsRes = await apiRequest('/marketplace/analytics');
      if (analyticsRes.success && analyticsRes.analytics) {
        setAnalytics(analyticsRes.analytics);
      }

      // Fetch settlements (transfers)
      const settlementsRes = await apiRequest('/marketplace/settlements');
      if (settlementsRes.success && settlementsRes.settlements) {
        setSettlements(settlementsRes.settlements);
      }

      // Fetch payouts
      const payoutsRes = await apiRequest('/marketplace/payouts');
      if (payoutsRes.success && payoutsRes.payouts) {
        setPayouts(payoutsRes.payouts);
      }
    } catch (err) {
      console.warn('Could not fetch KYC/settlement details:', err.message);
    }
  };

  const [localCoupons, setLocalCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);

  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState('flat');
  const [newCouponValue, setNewCouponValue] = useState('');
  const [newCouponMinOrder, setNewCouponMinOrder] = useState('');
  const [newCouponExpiry, setNewCouponExpiry] = useState('');

  const fetchCoupons = async () => {
    setLoadingCoupons(true);
    try {
      const res = await apiRequest('/restaurant/coupons');
      if (res.success && res.coupons) {
        setLocalCoupons(res.coupons);
      }
    } catch (err) {
      console.warn('Could not fetch coupons:', err.message);
    } finally {
      setLoadingCoupons(false);
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!newCouponCode || !newCouponValue) return;

    try {
      const res = await apiRequest('/restaurant/coupons', {
        method: 'POST',
        body: JSON.stringify({
          code: newCouponCode.toUpperCase(),
          discountType: newCouponType,
          discountValue: Number(newCouponValue),
          minOrderAmount: Number(newCouponMinOrder || 0),
          expiryDate: newCouponExpiry || undefined
        })
      });

      if (res.success && res.coupon) {
        alert('Coupon created successfully!');
        setLocalCoupons([...localCoupons, res.coupon]);
        setNewCouponCode('');
        setNewCouponValue('');
        setNewCouponMinOrder('');
        setNewCouponExpiry('');
      } else {
        alert('Failed to create coupon: ' + (res.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Error creating coupon: ' + err.message);
    }
  };

  const handleDeleteCoupon = async (copId) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    try {
      const res = await apiRequest(`/restaurant/coupons/${copId}`, {
        method: 'DELETE'
      });

      if (res.success) {
        setLocalCoupons(localCoupons.filter(c => c._id !== copId));
      } else {
        alert('Failed to delete coupon.');
      }
    } catch (err) {
      alert('Error deleting coupon: ' + err.message);
    }
  };

  useEffect(() => {
    if (activeTab === 'settings') {
      fetchKycAndSettlementData();
    } else if (activeTab === 'coupons') {
      fetchCoupons();
    }
  }, [activeTab]);

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
      setOwnerName(restaurant.ownerName || '');
      setBusinessEmail(restaurant.email || restaurant.contact?.email || '');
      setBusinessPhone(restaurant.phone || restaurant.contact?.phone || '');
      setPanNumber(restaurant.panNumber || '');
      setGstNumber(restaurant.gstNumber || '');
      setBusinessAddress(restaurant.address || restaurant.contact?.address || '');
      setLogo(restaurant.logo || '');
      setBanner(restaurant.banner || '');
      setTagline(restaurant.tagline || '');
      setTaglineInput(restaurant.tagline || '');
      setKycStatus(restaurant.kycStatus || 'pending');
      setSettlementStatus(restaurant.settlementStatus || 'suspended');
      setRazorpayAccountId(restaurant.razorpayAccountId || '');
      setCommissionPercent(restaurant.commissionPercent || 10);
    }
  }, [restaurant]);
  const handleImageUpload = async (file, onUploadSuccess) => {
    if (!file) return;
    
    const formData = new FormData();
    formData.append('image', file);

    try {
      const token = localStorage.getItem('Orderin_token');
      const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
      const response = await fetch(`${apiBase}/media/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (response.ok && data.success) {
        onUploadSuccess(data.url);
      } else {
        alert('Upload failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Error uploading image: ' + err.message);
    }
  };

  const updateSingleField = async (fieldName, fieldValue) => {
    try {
      const updatedFields = {
        name: restaurant.name,
        bankDetails,
        timings,
        settings,
        ownerName,
        email: businessEmail,
        phone: businessPhone,
        panNumber,
        gstNumber,
        address: businessAddress,
        logo,
        banner,
        tagline
      };
      
      // Override the specific field being edited
      updatedFields[fieldName] = fieldValue;

      const res = await apiRequest('/restaurant/profile', {
        method: 'POST',
        body: JSON.stringify(updatedFields)
      });

      if (res.success && res.restaurant) {
        // Sync local states
        if (fieldName === 'logo') setLogo(res.restaurant.logo);
        if (fieldName === 'banner') setBanner(res.restaurant.banner);
        if (fieldName === 'tagline') setTagline(res.restaurant.tagline);

        setRestaurants(restaurants.map(r => (r.id === restaurant.id || r._id === restaurant.id) ? {
          ...r,
          logo: res.restaurant.logo,
          banner: res.restaurant.banner,
          tagline: res.restaurant.tagline
        } : r));
      } else {
        alert("Failed to save changes: " + (res.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Error saving branding: " + err.message);
    }
  };

  const handleKycSubmit = async (e) => {
    e.preventDefault();

    if (!panNumber || !ownerName || !businessEmail || !businessPhone || !businessAddress) {
      alert('Please fill out all owner and business profile details.');
      return;
    }
    if (!bankDetails.accountHolderName || !bankDetails.bankName || !bankDetails.accountNumber || !bankDetails.ifscCode) {
      alert('Please fill out all bank account details.');
      return;
    }

    // Pattern validations
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)) {
      alert('Invalid PAN number format (should be ABCDE1234F).');
      return;
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankDetails.ifscCode)) {
      alert('Invalid Bank IFSC code format (should be ABCD0123456).');
      return;
    }
    if (!/^[0-9]{9,18}$/.test(bankDetails.accountNumber)) {
      alert('Invalid Bank Account Number (should be between 9 and 18 digits).');
      return;
    }
    if (gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstNumber)) {
      alert('Invalid GSTIN format (optional - leave empty or correct format).');
      return;
    }

    setRegisteringVendor(true);
    try {
      const res = await apiRequest('/marketplace/submit-kyc', {
        method: 'POST',
        body: JSON.stringify({
          ownerName,
          email: businessEmail,
          phone: businessPhone,
          panNumber,
          gstNumber,
          address: businessAddress,
          bankName: bankDetails.bankName,
          accountHolderName: bankDetails.accountHolderName,
          accountNumber: bankDetails.accountNumber,
          ifscCode: bankDetails.ifscCode
        })
      });

      if (res.success) {
        alert('Payout profile and bank details submitted and verified successfully!');
        setKycStatus('verified');
        setSettlementStatus('active');
        await fetchKycAndSettlementData();
      } else {
        alert('Submission failed: ' + (res.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Submission error: ' + err.message);
    } finally {
      setRegisteringVendor(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await apiRequest('/restaurant/profile', {
        method: 'POST',
        body: JSON.stringify({
          name: restaurant.name,
          bankDetails,
          timings,
          settings,
          ownerName,
          email: businessEmail,
          phone: businessPhone,
          panNumber,
          gstNumber, // GST is optional
          address: businessAddress,
          logo,
          banner,
          tagline
        })
      });

      if (res.success && res.restaurant) {
        alert("Branding, Timings and Tax settings updated successfully!");
        setRestaurants(restaurants.map(r => (r.id === restaurant.id || r._id === restaurant.id) ? {
          ...r,
          bankDetails: res.restaurant.bankDetails,
          timings: res.restaurant.timings,
          settings: res.restaurant.settings,
          ownerName: res.restaurant.ownerName,
          email: res.restaurant.email,
          phone: res.restaurant.phone,
          panNumber: res.restaurant.panNumber,
          gstNumber: res.restaurant.gstNumber,
          address: res.restaurant.address,
          kycStatus: res.restaurant.kycStatus,
          settlementStatus: res.restaurant.settlementStatus,
          razorpayAccountId: res.restaurant.razorpayAccountId,
          logo: res.restaurant.logo,
          banner: res.restaurant.banner,
          tagline: res.restaurant.tagline
        } : r));
      } else {
        alert("Failed to save settings: " + (res.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Error saving settings: " + err.message);
    }
  };


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

  const handleUpdatePreparationStatus = async (orderId, newPrepStatus) => {
    let orderStatus = 'placed';
    if (newPrepStatus === 'Preparing') orderStatus = 'preparing';
    if (newPrepStatus === 'Ready for Pickup') orderStatus = 'ready';
    if (newPrepStatus === 'Picked Up') orderStatus = 'completed';

    try {
      await apiRequest(`/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ 
          preparationStatus: newPrepStatus,
          orderStatus: orderStatus
        })
      });
    } catch (err) {
      console.warn("Could not sync preparation status to backend MongoDB. Syncing locally:", err.message);
    }
    
    setOrders(orders.map(o => o.id === orderId ? { ...o, preparationStatus: newPrepStatus, orderStatus: orderStatus } : o));
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
    } else {
      setRestaurants(restaurants.map(r => (r.id === restaurant.id || r._id === restaurant.id || r._id === restaurant._id) ? {
        ...r,
        tables: (r.tables || []).map(t => t.tableNo === qrTableNoInput ? { ...t, qrCodeUrl: resolvedQrCodeUrl } : t)
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
        
        {/* Floating Edit Banner Pen Button */}
        <div className="absolute top-4 right-4 z-20">
          <input 
            type="file" 
            accept="image/*"
            className="hidden"
            id="direct-banner-upload"
            onChange={e => handleImageUpload(e.target.files[0], url => updateSingleField('banner', url))}
          />
          <label 
            htmlFor="direct-banner-upload"
            className="bg-slate-900/80 backdrop-blur-md hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white p-2.5 rounded-xl cursor-pointer flex items-center justify-center transition shadow-lg gap-1.5 text-[10px] font-black uppercase tracking-wider"
            title="Edit Cover Image"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Cover</span>
          </label>
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 flex gap-4 items-end z-10">
          <div className="relative group/logo">
            <img 
              src={restaurant.logo} 
              alt={restaurant.name} 
              className="w-16 h-16 rounded-2xl object-contain bg-slate-900/90 p-2 border border-white/10 shadow-lg shadow-black/40 backdrop-blur-sm" 
            />
            <input 
              type="file" 
              accept="image/*"
              className="hidden"
              id="direct-logo-upload"
              onChange={e => handleImageUpload(e.target.files[0], url => updateSingleField('logo', url))}
            />
            <label 
              htmlFor="direct-logo-upload"
              className="absolute -bottom-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white p-1 rounded-lg cursor-pointer flex items-center justify-center transition shadow shadow-black/40 border border-slate-900"
              title="Change Logo"
            >
              <Edit className="w-3 h-3" />
            </label>
          </div>
          
          <div className="space-y-1 text-left flex-1">
            <span className="inline-flex items-center gap-1 bg-red-500/20 border border-red-500/30 text-red-400 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
              Restaurant Scoped Admin Node
            </span>
            <h2 className="text-2xl font-black text-white drop-shadow-md leading-tight">
              {restaurant.name} Catalog Portal
            </h2>
            
            {isEditingTagline ? (
              <div className="flex gap-2 items-center mt-1">
                <input 
                  type="text"
                  className="bg-slate-900/90 border border-slate-700 px-3 py-1 rounded-lg text-xs focus:outline-none focus:border-red-500 text-white w-64 h-7"
                  value={taglineInput}
                  onChange={e => setTaglineInput(e.target.value)}
                  placeholder="Type tagline..."
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      setIsEditingTagline(false);
                      updateSingleField('tagline', taglineInput);
                    } else if (e.key === 'Escape') {
                      setIsEditingTagline(false);
                      setTaglineInput(restaurant.tagline || '');
                    }
                  }}
                />
                <button 
                  type="button" 
                  onClick={() => {
                    setIsEditingTagline(false);
                    updateSingleField('tagline', taglineInput);
                  }}
                  className="p-1 bg-green-600 hover:bg-green-500 text-white rounded-lg transition"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setIsEditingTagline(false);
                    setTaglineInput(restaurant.tagline || '');
                  }}
                  className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-300 font-medium opacity-90 drop-shadow-sm flex items-center gap-1.5 mt-1">
                <span>{restaurant.tagline || 'Post foods, custom timings settings, table QRs, and track local customer orders'}</span>
                <button 
                  onClick={() => {
                    setTaglineInput(restaurant.tagline || 'Post foods, custom timings settings, table QRs, and track local customer orders');
                    setIsEditingTagline(true);
                  }}
                  className="text-slate-400 hover:text-white transition p-0.5"
                  title="Edit Tagline"
                >
                  <Edit className="w-3 h-3" />
                </button>
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="space-y-2">
          {[
            { id: 'dashboard', label: 'Scoped Metrics', icon: <BarChart3 className="w-4 h-4" /> },
            { id: 'menu', label: 'Food Catalog Posts', icon: <Pizza className="w-4 h-4" /> },
            { id: 'orders', label: 'Orders Dashboard', icon: <ClipboardList className="w-4 h-4" /> },
            { id: 'upcoming', label: 'Upcoming Orders', icon: <Clock className="w-4 h-4" /> },
            { id: 'qr', label: 'QR Table codes', icon: <QrCode className="w-4 h-4" /> },
            { id: 'coupons', label: 'Coupons Manager', icon: <Percent className="w-4 h-4" /> },
            { id: 'settings', label: 'Settings & Bank', icon: <Settings className="w-4 h-4" /> }
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
              <span className="flex items-center gap-3">
                {tab.icon}
                <span>{tab.label}</span>
              </span>
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
              Lobby Queue TV
            </span>
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </a>

          {/* SaaS Subscription Info Card */}
          <div className="bg-slate-900 border border-white/5 p-4 rounded-2xl space-y-3 mt-4 text-left shadow-sm">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Subscription Plan</span>
              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                restaurant.subscriptionPlan === 'free'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}>
                {restaurant.subscriptionPlan === 'free' ? 'Free Trial' : 'Premium Pro'}
              </span>
            </div>

            <div className="space-y-1">
              <p className="text-white text-xs font-black">
                {restaurant.subscriptionPlan === 'free' ? 'Ticking Time Left:' : 'Subscription Expiry:'}
              </p>
              <p className={`text-[11px] font-bold font-mono ${
                restaurant.subscriptionPlan === 'free' ? 'text-amber-400' : 'text-slate-300'
              }`}>
                {restaurant.subscriptionPlan === 'free' 
                  ? timeLeftStr || 'Expired'
                  : restaurant.subscriptionExpiry 
                    ? new Date(restaurant.subscriptionExpiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                    : 'N/A'
                }
              </p>
              {restaurant.subscriptionPlan !== 'free' && timeLeftStr && (
                <p className="text-[9px] text-slate-500 font-medium">({timeLeftStr})</p>
              )}
            </div>

            <button
              onClick={handleRenewSubscription}
              disabled={renewing}
              className="w-full py-2 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-slate-300 hover:text-white font-bold text-[10px] rounded-xl transition text-center uppercase tracking-wider cursor-pointer"
            >
              {renewing ? 'Renewing...' : 'Extend / Renew'}
            </button>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Premium Dashboard Subscription Banner */}
              <div className="bg-slate-900 border border-indigo-500/10 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden shadow-lg shadow-indigo-950/5">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -z-10" />
                <div className="space-y-1 text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 text-[9px] uppercase font-black px-2.5 py-0.5 rounded-full tracking-wider">
                      SaaS Active Cycle
                    </span>
                    {restaurant.subscriptionPlan === 'free' && (
                      <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] uppercase font-black px-2.5 py-0.5 rounded-full tracking-wider animate-pulse">
                        Time Ticking
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-black text-white pt-1">
                    {restaurant.subscriptionPlan === 'free' 
                      ? 'Free Trial Sandbox Active' 
                      : 'Premium Pro Subscription Active'
                    }
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                    {restaurant.subscriptionPlan === 'free' 
                      ? `Your 15-day trial is ticking. You have exactly ${timeLeftStr || '0s'} remaining. Upgrade to Premium Pro to keep tableside dine-ins running permanently.`
                      : `Premium billing active. Exact expiration date: ${restaurant.subscriptionExpiry ? new Date(restaurant.subscriptionExpiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'} (${timeLeftStr || '0 days left'}).`
                    }
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleRenewSubscription}
                    disabled={renewing}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow transition active:scale-[0.98] disabled:opacity-60 cursor-pointer uppercase tracking-wider"
                  >
                    {renewing ? 'Renewing Plan...' : 'Renew / Extend Plan'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: 'Your Orders count', count: localOrders.length, desc: 'Total dining backlog', icon: <Utensils className="w-5 h-5 text-indigo-400" /> },
                  { label: 'Restaurant Sales', count: `₹${Math.round(salesVolume)}`, desc: 'Paid gross earnings', icon: <DollarSign className="w-5 h-5 text-emerald-400" /> },
                  { label: 'Bestseller Today', count: todayBestseller ? (todayBestseller.name.length > 15 ? todayBestseller.name.substring(0, 13) + '..' : todayBestseller.name) : 'None yet', desc: todayBestseller ? `${todayBestseller.quantity} portions sold` : 'No sales today', icon: <Pizza className="w-5 h-5 text-rose-400 animate-pulse" /> },
                  { label: 'Current Ratings', count: restaurant.rating, desc: 'Customer stars average', icon: <Star className="w-5 h-5 text-amber-400 fill-amber-400" /> }
                ].map((c, i) => (
                  <div key={i} className="bg-slate-900/60 rounded-3xl border border-white/5 p-6 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{c.label}</span>
                      <h4 className="text-xl font-black text-white mt-1 select-all" title={typeof c.count === 'string' ? c.count : undefined}>{c.count}</h4>
                      <p className="text-[9px] text-slate-500 mt-0.5">{c.desc}</p>
                    </div>
                    <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center">
                      {c.icon}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Column 1: Live Performance Chart */}
                <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 flex flex-col justify-between">
                  <h3 className="text-sm font-black text-white text-left uppercase tracking-wider">📈 Live Performance Chart</h3>
                  <div className="h-64 mt-4 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={[
                          { name: 'Week 1', sales: Math.round(salesVolume * 0.15) },
                          { name: 'Week 2', sales: Math.round(salesVolume * 0.3) },
                          { name: 'Week 3', sales: Math.round(salesVolume * 0.4) },
                          { name: 'Week 4', sales: Math.round(salesVolume * 0.15) }
                        ]}
                      >
                        <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                        <YAxis stroke="#64748b" fontSize={9} />
                        <Tooltip />
                        <Area type="monotone" dataKey="sales" stroke="#ff385c" fill="rgba(255, 56, 92, 0.1)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Column 2: Top Selling Dishes Breakdown */}
                <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 flex flex-col justify-between text-left">
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">🔥 Top Selling Dishes Breakdown</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Which items are selling the most portions</p>
                  </div>
                  
                  {itemSalesStats.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-center p-4">
                      <Pizza className="w-8 h-8 text-slate-700 mb-2 animate-bounce" />
                      <p className="text-xs text-slate-500 font-bold">No items sold yet.</p>
                      <p className="text-[10px] text-slate-600 mt-0.5">Dishes stats will populate once customers place dine-in/pickup orders.</p>
                    </div>
                  ) : (
                    <div className="h-64 mt-4 space-y-3.5 overflow-y-auto pr-1">
                      {itemSalesStats.slice(0, 5).map((item, idx) => {
                        const totalPortions = itemSalesStats.reduce((sum, i) => sum + i.quantity, 0);
                        const pct = totalPortions > 0 ? Math.round((item.quantity / totalPortions) * 100) : 0;
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-xs font-bold text-slate-300">
                              <span className="truncate max-w-[170px]">{item.name}</span>
                              <span className="font-mono text-slate-400">
                                x{item.quantity} portions <span className="text-[10px] text-slate-600">({pct}%)</span>
                              </span>
                            </div>
                            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-white/5">
                              <div 
                                className="bg-gradient-to-r from-red-500 to-orange-500 h-full rounded-full transition-all duration-500" 
                                style={{ width: `${pct}%` }} 
                              />
                            </div>
                            <div className="flex justify-between text-[9px] text-slate-500 font-semibold">
                              <span>Rank #{idx + 1} Bestseller</span>
                              <span className="text-emerald-400 font-mono">Revenue: ₹{Math.round(item.revenue)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
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
                    <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Category Image</label>
                    <div className="flex gap-2 items-center">
                      <input 
                        type="file" 
                        accept="image/*"
                        className="hidden"
                        id="cat-image-upload"
                        onChange={e => handleImageUpload(e.target.files[0], url => setNewCatImage(url))}
                      />
                      <label 
                        htmlFor="cat-image-upload"
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 cursor-pointer flex items-center justify-center whitespace-nowrap h-[34px]"
                      >
                        Select Image
                      </label>
                      {newCatImage && (
                        <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl px-2.5 py-1 text-[10px] font-bold h-[34px]">
                          <img src={newCatImage} className="w-4 h-4 object-cover rounded-md" alt="" />
                          <span>Uploaded</span>
                        </div>
                      )}
                    </div>
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
                  {localOrders.map(ord => {
                    const itemSummary = ord.items.map(i => i.name).join(', ');
                    const statusSteps = [
                      { key: 'placed', label: 'Placed', icon: '📥', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30', active: 'bg-amber-500 text-white border-amber-500' },
                      { key: 'preparing', label: 'Preparing', icon: '🍳', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30', active: 'bg-blue-500 text-white border-blue-500' },
                      { key: 'ready', label: 'Ready', icon: '🛵', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', active: 'bg-emerald-500 text-white border-emerald-500' },
                      { key: 'completed', label: 'Done', icon: '✓', color: 'bg-slate-500/15 text-slate-400 border-slate-500/30', active: 'bg-emerald-600 text-white border-emerald-600' }
                    ];
                    return (
                    <div key={ord.id} className="bg-slate-900 border border-white/5 rounded-3xl p-5 space-y-4">
                      {/* Header: Item names + Table */}
                      <div className="flex justify-between items-start pb-3 border-b border-white/5">
                        <div className="flex-1 min-w-0">
                          <p className="font-extrabold text-white text-sm truncate" title={itemSummary}>{itemSummary}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {ord.tableNo && <span className="bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded">Table {ord.tableNo}</span>}
                            <span className="text-[10px] text-slate-500 font-mono">#{ord.id?.slice?.(-6) || ord.id}</span>
                          </div>
                        </div>
                      </div>

                      {/* Status action buttons */}
                      <div className="flex gap-2 flex-wrap">
                        {statusSteps.map(step => (
                          <button
                            key={step.key}
                            onClick={() => handleUpdateOrderStatus(ord.id, step.key)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all duration-200 ${
                              ord.orderStatus === step.key
                                ? step.active + ' shadow-lg scale-105'
                                : step.color + ' hover:opacity-80 opacity-60'
                            }`}
                          >
                            <span>{step.icon}</span>
                            <span>{step.label}</span>
                          </button>
                        ))}
                      </div>

                      {/* Order items */}
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
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'upcoming' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white">Upcoming Orders</h3>
                <p className="text-xs text-slate-400">Manage advance schedule and traveling route orders</p>
              </div>

              {localOrders.filter(o => o.orderType === 'route' || o.orderType === 'scheduled').length === 0 ? (
                <div className="text-center py-16 bg-slate-900 rounded-3xl p-4">
                  <p className="text-xs text-slate-400">No upcoming route or scheduled orders active</p>
                </div>
              ) : (
                <div className="bg-slate-900 border border-white/5 rounded-3xl overflow-hidden text-left">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 uppercase font-extrabold tracking-wider border-b border-white/5">
                        <th className="p-4">Order ID & Type</th>
                        <th className="p-4">Customer Name</th>
                        <th className="p-4">Pickup Info</th>
                        <th className="p-4">OTP / QR Code</th>
                        <th className="p-4">Preparation Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {localOrders.filter(o => o.orderType === 'route' || o.orderType === 'scheduled').map(ord => {
                        const itemsSummary = ord.items.map(i => `${i.name} (x${i.quantity})`).join(', ');
                        return (
                          <tr key={ord.id} className="border-b border-white/5 hover:bg-slate-900/60 transition">
                            <td className="p-4">
                              <span className="font-mono text-slate-400">#{ord.id?.slice(-8)}</span>
                              <div className="flex gap-1.5 mt-1">
                                {ord.orderType === 'route' ? (
                                  <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase">
                                    🚗 Route
                                  </span>
                                ) : (
                                  <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase">
                                    ⏰ Scheduled
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="font-extrabold text-white block">{ord.customerName}</span>
                              <span className="text-[10px] text-slate-500 block mt-0.5">{ord.customerPhone}</span>
                              <span className="text-[10px] text-slate-400 italic block mt-1 truncate max-w-[200px]" title={itemsSummary}>
                                Items: {itemsSummary}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] px-2.5 py-1 rounded-xl font-bold inline-block">
                                🕒 {ord.pickupTime}
                              </span>
                              {ord.orderType === 'route' && (
                                <p className="text-[10px] text-slate-400 mt-1">
                                  Corridor: {ord.routeFrom} ➔ {ord.routeTo}
                                </p>
                              )}
                            </td>
                            <td className="p-4 font-bold">
                              <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-3 py-1 rounded-xl font-mono tracking-wider font-extrabold">
                                {ord.pickupCode || '4820'}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <select
                                  value={ord.preparationStatus || 'Pending'}
                                  onChange={(e) => handleUpdatePreparationStatus(ord.id, e.target.value)}
                                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-[11px] font-bold text-white focus:outline-none focus:border-red-500 cursor-pointer"
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Preparing">Preparing</option>
                                  <option value="Ready for Pickup">Ready for Pickup</option>
                                  <option value="Picked Up">Picked Up</option>
                                </select>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
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

          {activeTab === 'coupons' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center text-left">
                <div>
                  <h3 className="text-lg font-bold text-white">Coupons Manager</h3>
                  <p className="text-xs text-slate-400 font-medium">Offer discounts to your customers using custom coupons</p>
                </div>
              </div>

              {/* Create Coupon Form */}
              <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 text-left space-y-4">
                <h4 className="text-sm font-extrabold text-white">Create New Coupon</h4>
                <form onSubmit={handleCreateCoupon} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Coupon Code</label>
                    <input 
                      type="text" required placeholder="e.g. RESTRO100" 
                      className="w-full bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl text-xs focus:outline-none focus:border-red-500 text-white uppercase"
                      value={newCouponCode}
                      onChange={e => setNewCouponCode(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Discount Type</label>
                    <select 
                      className="w-full bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl text-xs focus:outline-none focus:border-red-500 text-white"
                      value={newCouponType}
                      onChange={e => setNewCouponType(e.target.value)}
                    >
                      <option value="flat">Flat ₹ Discount</option>
                      <option value="percentage">% Discount</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Discount Value</label>
                    <input 
                      type="number" required placeholder="e.g. 100" 
                      className="w-full bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl text-xs focus:outline-none focus:border-red-500 text-white"
                      value={newCouponValue}
                      onChange={e => setNewCouponValue(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Min Order Amount (₹)</label>
                    <input 
                      type="number" placeholder="e.g. 499" 
                      className="w-full bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl text-xs focus:outline-none focus:border-red-500 text-white"
                      value={newCouponMinOrder}
                      onChange={e => setNewCouponMinOrder(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="py-2.5 px-5 bg-gradient-to-r from-red-500 to-orange-500 text-white font-extrabold text-xs rounded-xl shadow transition hover:scale-[1.02] h-10 flex items-center justify-center">
                    Create Coupon
                  </button>
                </form>
              </div>

              {/* Active Coupons List */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {localCoupons.map(cop => (
                  <div key={cop._id} className="bg-slate-900 border border-indigo-500/20 rounded-3xl p-5 space-y-3 relative overflow-hidden text-left shadow-lg">
                    {/* Header Details */}
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="inline-flex items-center bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                          {cop.code}
                        </span>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pt-2">
                          {cop.discountType === 'flat' 
                            ? `Flat ₹${cop.discountValue} Off` 
                            : `${cop.discountValue}% Off`}
                        </p>
                      </div>
                      <button 
                        onClick={() => handleDeleteCoupon(cop._id)}
                        className="p-2 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 text-red-400 transition"
                        title="Delete coupon"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="h-px bg-white/5 my-2"></div>

                    {/* Sub Info details */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Min Order Amount</span>
                        <span className="font-extrabold text-slate-200">₹{cop.minOrderAmount}</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Expiry Date</span>
                        <span className="font-extrabold text-slate-200">
                          {new Date(cop.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {localCoupons.length === 0 && (
                  <div className="col-span-full bg-slate-900/60 rounded-3xl border border-white/5 py-12 text-center text-slate-400 text-xs font-bold space-y-2">
                    <p className="text-xl">🎟️</p>
                    <p>No custom coupons created yet.</p>
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

                {/* 2. Razorpay Route KYC & Bank Onboarding Board */}
                <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 space-y-6">
                  <div className="pb-3 border-b border-white/5 flex justify-between items-center">
                    <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-emerald-400" />
                      Razorpay Route KYC & Settlement Onboarding
                    </h4>
                    
                    {/* KYC Badges */}
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      kycStatus === 'verified'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : kycStatus === 'submitted'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : kycStatus === 'rejected'
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                    }`}>
                      KYC: {kycStatus}
                    </span>
                  </div>

                  {/* Payout Bank Profile Status Banner */}
                  {kycStatus === 'verified' ? (
                    <div className="bg-emerald-950/20 border border-emerald-500/20 text-emerald-300 rounded-2xl p-4 text-xs leading-relaxed space-y-2">
                      <div className="flex items-center gap-2 font-bold">
                        <span>✓ Payout Bank Profile Active</span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Your bank details are active and verified. Customer payments go to the central platform account, and your net earnings (<strong>{100 - commissionPercent}%</strong> of order totals) will be transferred manually by the Super Admin to your registered bank account.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-blue-950/20 border border-blue-500/20 text-blue-300 rounded-2xl p-4 text-xs leading-relaxed">
                      💡 <strong>Register Payout Details:</strong> Please fill out your business profile and bank details. Your profile will be automatically verified immediately so the Super Admin can wire manual payouts to your bank account.
                    </div>
                  )}

                  {/* Onboarding fields */}
                  <div className="space-y-4">
                    <h5 className="text-xs font-black text-slate-300 uppercase tracking-wider">Business Profile</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Owner Name</label>
                        <input
                          type="text"
                          required
                          className="w-full bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-emerald-500 text-white font-bold disabled:opacity-60"
                          value={ownerName}
                          onChange={e => setOwnerName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Business Email</label>
                        <input
                          type="email"
                          required
                          className="w-full bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-emerald-500 text-white font-bold disabled:opacity-60"
                          value={businessEmail}
                          onChange={e => setBusinessEmail(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Business Phone</label>
                        <input
                          type="text"
                          required
                          className="w-full bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-emerald-500 text-white font-bold disabled:opacity-60"
                          value={businessPhone}
                          onChange={e => setBusinessPhone(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">PAN Number (Individual / Business)</label>
                        <input
                          type="text"
                          required
                          maxLength="10"
                          placeholder="e.g. ABCDE1234F"
                          className="w-full bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-emerald-500 text-white font-bold disabled:opacity-60"
                          value={panNumber}
                          onChange={e => setPanNumber(e.target.value.toUpperCase())}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">GST Number <span className="text-slate-500 font-semibold">(Optional)</span></label>
                        <input
                          type="text"
                          maxLength="15"
                          placeholder="e.g. 27ABCDE1234F1Z5"
                          className="w-full bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-emerald-500 text-white font-bold disabled:opacity-60"
                          value={gstNumber}
                          onChange={e => setGstNumber(e.target.value.toUpperCase())}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Business Location Area</label>
                        <select 
                          className="w-full bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-emerald-500 text-white font-bold cursor-pointer"
                          value={HYD_AREAS.find(area => businessAddress.toLowerCase().includes(area.toLowerCase())) || ""}
                          onChange={e => {
                            const newArea = e.target.value;
                            const matched = HYD_AREAS.find(area => businessAddress.toLowerCase().includes(area.toLowerCase()));
                            if (matched) {
                              const regex = new RegExp(matched, 'gi');
                              setBusinessAddress(businessAddress.replace(regex, newArea));
                            } else {
                              setBusinessAddress(`${newArea}, Hyderabad, India`);
                            }
                          }}
                        >
                          <option value="" disabled>Select Area...</option>
                          {HYD_AREAS.map(area => (
                            <option key={area} value={area}>{area}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Business Street Address</label>
                        <input
                          type="text"
                          required
                          className="w-full bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-emerald-500 text-white font-bold disabled:opacity-60"
                          value={businessAddress}
                          onChange={e => setBusinessAddress(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <h5 className="text-xs font-black text-slate-300 uppercase tracking-wider">Payout Bank Details</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Account Holder Name</label>
                        <input
                          type="text"
                          required
                          className="w-full bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-emerald-500 text-white font-bold disabled:opacity-60"
                          value={bankDetails.accountHolderName}
                          onChange={e => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Bank Name</label>
                        <input
                          type="text"
                          required
                          className="w-full bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-emerald-500 text-white font-bold disabled:opacity-60"
                          value={bankDetails.bankName}
                          onChange={e => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Account Number</label>
                        <input
                          type="text"
                          required
                          className="w-full bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-emerald-500 text-white font-bold disabled:opacity-60"
                          value={bankDetails.accountNumber}
                          onChange={e => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Bank IFSC Code</label>
                        <input
                          type="text"
                          required
                          maxLength="11"
                          className="w-full bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-emerald-500 text-white font-bold disabled:opacity-60"
                          value={bankDetails.ifscCode}
                          onChange={e => setBankDetails({ ...bankDetails, ifscCode: e.target.value.toUpperCase() })}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-white/5">
                      <button
                        type="button"
                        onClick={handleKycSubmit}
                        disabled={registeringVendor}
                        className="py-3 px-8 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow transition disabled:opacity-60 flex items-center gap-2"
                      >
                        {registeringVendor ? (
                          <>
                            <span className="animate-spin w-3 h-3 rounded-full border border-t-transparent border-white" />
                            Saving Profile...
                          </>
                        ) : (
                          'Save Payout Bank Profile'
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. Marketplace Settlement & Payout Dashboard */}
                {kycStatus === 'verified' && (
                  <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 space-y-6 text-left">
                    <div>
                      <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                        <Landmark className="w-4 h-4 text-emerald-400" />
                        Split Settlement & Payout Ledger
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Real-time statistics of split funds and bulk bank settlement payouts.</p>
                    </div>

                    {/* Analytics Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-slate-950 p-4 border border-white/5 rounded-2xl">
                        <span className="text-[9px] text-slate-500 uppercase font-black tracking-wide">Total Sales Volume</span>
                        <h4 className="text-base font-black text-white mt-1">₹{analytics.totalSales}</h4>
                      </div>
                      <div className="bg-slate-950 p-4 border border-white/5 rounded-2xl">
                        <span className="text-[9px] text-slate-500 uppercase font-black tracking-wide">Your Net Earnings</span>
                        <h4 className="text-base font-black text-emerald-400 mt-1">₹{analytics.restaurantShare}</h4>
                      </div>
                      <div className="bg-slate-950 p-4 border border-white/5 rounded-2xl">
                        <span className="text-[9px] text-slate-500 uppercase font-black tracking-wide">Platform Comm ({commissionPercent}%)</span>
                        <h4 className="text-base font-black text-indigo-400 mt-1">₹{analytics.platformCommission}</h4>
                      </div>
                      <div className="bg-slate-950 p-4 border border-white/5 rounded-2xl">
                        <span className="text-[9px] text-slate-500 uppercase font-black tracking-wide">Settled to Bank</span>
                        <h4 className="text-base font-black text-white mt-1">₹{analytics.settledToBank}</h4>
                      </div>
                    </div>

                    {/* Pending settlements and failed splits alert */}
                    <div className="flex flex-wrap gap-4">
                      <div className="flex-1 bg-slate-950/60 p-4 border border-white/5 rounded-2xl flex justify-between items-center text-xs">
                        <div>
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Uncleared Escrow balance</span>
                          <span className="font-extrabold text-amber-400 text-sm mt-0.5 inline-block">₹{analytics.pendingSettlements}</span>
                        </div>
                        <p className="text-[9px] text-slate-500 text-right max-w-[200px]">Funds captured in Razorpay route, awaiting bulk batch settlement to bank account</p>
                      </div>
                      {analytics.failedTransfersCount > 0 && (
                        <div className="flex-1 bg-red-950/20 border border-red-500/20 p-4 rounded-2xl flex justify-between items-center text-xs text-red-300">
                          <div>
                            <span className="text-[9px] text-red-400 font-black uppercase tracking-wider block">🚨 Failed Split transfers alert</span>
                            <span className="font-extrabold text-sm mt-0.5 inline-block">{analytics.failedTransfersCount} Splits failed</span>
                          </div>
                          <p className="text-[9px] text-red-400/80 text-right max-w-[200px]">Errors detected during transfer (IFSC mismatches, account locks). Admin is retrying splits.</p>
                        </div>
                      )}
                    </div>

                    {/* Split transfers logs table */}
                    <div className="space-y-3 pt-4 border-t border-white/5">
                      <h5 className="text-xs font-black text-slate-300 uppercase tracking-wider">Split Settlements History (Order Level)</h5>
                      {settlements.length === 0 ? (
                        <p className="text-[11px] text-slate-500 py-4 text-center">No order split transfers executed yet.</p>
                      ) : (
                        <div className="overflow-x-auto max-h-60 border border-white/5 rounded-2xl bg-slate-950">
                          <table className="w-full text-left text-[11px]">
                            <thead>
                              <tr className="bg-slate-900 border-b border-white/5 text-slate-400 font-bold uppercase">
                                <th className="p-3">Transfer ID</th>
                                <th className="p-3">Order Amount</th>
                                <th className="p-3">Your Split</th>
                                <th className="p-3">Platform Cut</th>
                                <th className="p-3 text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {settlements.map(setl => {
                                const orderAmount = setl.order?.totalAmount || setl.amount;
                                const platformCut = Math.round((orderAmount - setl.amount) * 100) / 100;
                                return (
                                  <tr key={setl._id} className="border-b border-white/5 hover:bg-slate-900/40 text-slate-300">
                                    <td className="p-3 font-mono text-[10px] text-slate-400">{setl.razorpayTransferId}</td>
                                    <td className="p-3">₹{orderAmount}</td>
                                    <td className="p-3 font-bold text-emerald-400">₹{setl.amount}</td>
                                    <td className="p-3 text-slate-500">₹{platformCut}</td>
                                    <td className="p-3 text-center">
                                      <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-bold ${
                                        setl.status === 'processed'
                                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                          : setl.status === 'failed'
                                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                      }`}>
                                        {setl.status}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Bank payout logs table */}
                    <div className="space-y-3 pt-4 border-t border-white/5">
                      <h5 className="text-xs font-black text-slate-300 uppercase tracking-wider">Bank Payout Logs (Bulk Payout Settlements)</h5>
                      {payouts.length === 0 ? (
                        <p className="text-[11px] text-slate-500 py-4 text-center">No payouts settled to your bank account yet.</p>
                      ) : (
                        <div className="overflow-x-auto max-h-60 border border-white/5 rounded-2xl bg-slate-950">
                          <table className="w-full text-left text-[11px]">
                            <thead>
                              <tr className="bg-slate-900 border-b border-white/5 text-slate-400 font-bold uppercase">
                                <th className="p-3">Settlement ID</th>
                                <th className="p-3">Net Settled</th>
                                <th className="p-3">Gateway Fees</th>
                                <th className="p-3">Taxes</th>
                                <th className="p-3">Processed Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {payouts.map(pay => (
                                <tr key={pay._id} className="border-b border-white/5 hover:bg-slate-900/40 text-slate-300">
                                  <td className="p-3 font-mono text-[10px] text-slate-400">{pay.razorpaySettlementId}</td>
                                  <td className="p-3 font-bold text-emerald-400">₹{pay.amount}</td>
                                  <td className="p-3 text-slate-500">₹{pay.fees}</td>
                                  <td className="p-3 text-slate-500">₹{pay.tax}</td>
                                  <td className="p-3">{new Date(pay.settledAt).toLocaleDateString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Save timings and tax settings button */}
                <div className="flex justify-end pt-4">
                  <button 
                    type="submit" 
                    className="py-3 px-8 bg-gradient-to-r from-red-500 to-orange-500 text-white font-extrabold text-xs rounded-xl shadow transition hover:scale-[1.02]"
                  >
                    Save Timings & Tax Configurations
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
                  <label className="text-xs text-slate-400 font-semibold uppercase">Dish Image</label>
                  <div className="flex gap-2 items-center">
                    <input 
                      type="file" 
                      accept="image/*"
                      className="hidden"
                      id="dish-image-upload"
                      onChange={e => handleImageUpload(e.target.files[0], url => setNewDish({ ...newDish, image: url }))}
                    />
                    <label 
                      htmlFor="dish-image-upload"
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 cursor-pointer flex items-center justify-center whitespace-nowrap h-[40px]"
                    >
                      Select Image
                    </label>
                    {newDish.image && (
                      <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl px-3 py-1.5 text-xs font-bold h-[40px]">
                        <img src={newDish.image} className="w-5 h-5 object-cover rounded-md" alt="" />
                        <span>Uploaded</span>
                      </div>
                    )}
                  </div>
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
                  <label className="text-xs text-slate-400 font-semibold uppercase">Dish Image</label>
                  <div className="flex gap-2 items-center">
                    <input 
                      type="file" 
                      accept="image/*"
                      className="hidden"
                      id="edit-dish-image-upload"
                      onChange={e => handleImageUpload(e.target.files[0], url => setEditDish({ ...editDish, image: url }))}
                    />
                    <label 
                      htmlFor="edit-dish-image-upload"
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 cursor-pointer flex items-center justify-center whitespace-nowrap h-[40px]"
                    >
                      Change Image
                    </label>
                    {editDish.image && (
                      <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl px-3 py-1.5 text-xs font-bold h-[40px]">
                        <img src={editDish.image} className="w-5 h-5 object-cover rounded-md" alt="" />
                        <span>Uploaded</span>
                      </div>
                    )}
                  </div>
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

      {/* ── EXPIRY HOLD BLOCKING OVERLAY ── */}
      {isSubscriptionExpired && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[80] flex items-center justify-center p-6 text-center select-none">
          <div className="w-full max-w-lg bg-slate-900 border border-red-500/20 rounded-3xl p-8 shadow-2xl space-y-6 animate-pulse-slow">
            <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-center mx-auto text-red-500">
              <Clock className="w-10 h-10 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">⚠️ Subscription Expired / Account On Hold</h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Your SaaS billing cycle is completed. To reactivate tableside QR ordering, public menus, and analytics dashboards, please renew your Premium Pro subscription.
              </p>
            </div>

            <div className="bg-slate-950/80 p-5 rounded-2xl border border-white/5 space-y-3 text-xs text-left max-w-sm mx-auto">
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold uppercase">Plan Type:</span>
                <span className="text-white font-extrabold uppercase">{restaurant.subscriptionPlan === 'free' ? 'Free Trial (Expired)' : 'Premium Pro (Expired)'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold uppercase">Expired On:</span>
                <span className="text-red-400 font-extrabold font-mono">
                  {restaurant.subscriptionExpiry 
                    ? new Date(restaurant.subscriptionExpiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                    : 'N/A'
                  }
                </span>
              </div>
            </div>

            <button
              onClick={handleRenewSubscription}
              disabled={renewing}
              className="w-full max-w-xs py-3.5 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-black text-xs rounded-xl shadow-lg transition hover:scale-[1.03] disabled:opacity-60 cursor-pointer uppercase tracking-wider"
            >
              {renewing ? 'Processing Renewal...' : `Renew Subscription (₹${SUBSCRIPTION_MONTHLY_PRICE_INR} / Month)`}
            </button>
          </div>
        </div>
      )}

    </motion.div>
  );
}
