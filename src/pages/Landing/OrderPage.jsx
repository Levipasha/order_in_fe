import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Navigation, Clock, Calendar, Check, ArrowRight, ArrowLeft, 
  Utensils, Star, CreditCard, ShoppingBag, Sparkles, ChevronRight, CheckCircle2, Ticket
} from 'lucide-react';
import { apiRequest } from '../../utils/api';
import Loader from '../Loader';
import routeMapImage from './map_route_image.jpg';
import scheduleOrderImage from './schedule_order_image.jpg';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const REST_COORDS = {
  'pizza-hub': [17.4121, 78.4610],
  'curry-palace': [17.4156, 78.4347],
  'green-garden': [17.3912, 78.4735]
};

const HYD_AREAS = [
  "Uppal", "Secunderabad", "Banjara Hills", "Jubilee Hills", 
  "Gachibowli", "Madhapur", "Begumpet", "Khairatabad", 
  "Abids", "Kondapur", "Charminar", "Kukatpally", 
  "Dilsukhnagar", "Mehdipatnam", "Hitech City", "Nampally", "Habsiguda"
];

export default function OrderPage({ 
  restaurants, 
  setCurrentView, 
  setOrders, 
  orders,
  initialFlow = null
}) {
  const [selectedFlow, setSelectedFlow] = useState(initialFlow);
  const [step, setStep] = useState(1);

  // Sync selected flow with initial flow trigger from landing page
  React.useEffect(() => {
    if (initialFlow) {
      setSelectedFlow(initialFlow);
      setStep(1);
    }
  }, [initialFlow]);

  // --- FLOW 1: Route Order State ---
  const [routeFrom, setRouteFrom] = useState('Uppal');
  const [routeTo, setRouteTo] = useState('Secunderabad');
  const [routeCalculated, setRouteCalculated] = useState(false);
  const [nearbyRestaurants, setNearbyRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

  // Live Map Integration States
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [userCoords, setUserCoords] = useState([17.3850, 78.4867]); // Hyderabad center default
  const [mapInstance, setMapInstance] = useState(null);
  const [markersGroup, setMarkersGroup] = useState(null);
  const [routePolyline, setRoutePolyline] = useState(null);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);

  // Inject Leaflet CSS, Custom Styles and JS
  useEffect(() => {
    if (!selectedFlow || selectedFlow !== 'route') return;

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (!document.getElementById('leaflet-custom-styles')) {
      const style = document.createElement('style');
      style.id = 'leaflet-custom-styles';
      style.innerHTML = `
        .custom-user-marker, .custom-restaurant-marker, .start-marker, .end-marker {
          display: flex !important;
          align-items: center;
          justify-content: center;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 20px !important;
          padding: 6px !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.15) !important;
          border: 1px solid #f1f5f9 !important;
          background: #ffffff !important;
        }
        .leaflet-popup-tip {
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15) !important;
        }
      `;
      document.head.appendChild(style);
    }

    if (!window.L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => {
        setLeafletLoaded(true);
      };
      document.body.appendChild(script);
    } else {
      setLeafletLoaded(true);
    }
  }, [selectedFlow]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!leafletLoaded || !document.getElementById('leaflet-travel-map') || mapInstance) return;

    const map = window.L.map('leaflet-travel-map').setView(userCoords, 12);
    
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const markers = window.L.layerGroup().addTo(map);
    setMarkersGroup(markers);
    setMapInstance(map);

    // Initial User Location Marker
    const userIcon = window.L.divIcon({
      className: 'custom-user-marker',
      html: `<div class="relative flex items-center justify-center">
        <span class="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-blue-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-4 w-4 bg-blue-600 border-2 border-white shadow-md"></span>
      </div>`,
      iconSize: [24, 24]
    });
    window.L.marker(userCoords, { icon: userIcon })
      .addTo(markers)
      .bindPopup('<strong>My Current Location</strong>')
      .openPopup();

    // Check Geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const newCoords = [lat, lng];
          setUserCoords(newCoords);
          map.setView(newCoords, 13);
          
          markers.clearLayers();
          window.L.marker(newCoords, { icon: userIcon })
            .addTo(markers)
            .bindPopup('<strong>My Current Location</strong>')
            .openPopup();
        },
        (err) => console.log("User geolocation denied.")
      );
    }

    return () => {
      map.remove();
      setMapInstance(null);
      setMarkersGroup(null);
      setRoutePolyline(null);
    };
  }, [leafletLoaded]);

  // Plot Restaurants and Draw Route path when locations change
  useEffect(() => {
    if (!mapInstance || !markersGroup || !restaurants || restaurants.length === 0) return;

    const plot = async () => {
      markersGroup.clearLayers();

      // Plot User
      const userIcon = window.L.divIcon({
        className: 'custom-user-marker',
        html: `<div class="relative flex items-center justify-center">
          <span class="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-blue-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-4 w-4 bg-blue-600 border-2 border-white shadow-md"></span>
        </div>`,
        iconSize: [24, 24]
      });
      window.L.marker(userCoords, { icon: userIcon })
        .addTo(markersGroup)
        .bindPopup('<strong>My Current Location</strong>');

      // Plot Restaurants with actual logos in premium circular badges (by default, show all available ones!)
      restaurants.forEach((rest) => {
        const restSlug = rest.slug?.toLowerCase();
        const restAddrLower = (rest.address || rest.contact?.address || '').toLowerCase();
        
        // Dynamic mapping of predefined Hyderabad area coordinates
        const AREA_COORDS = {
          "uppal": [17.3984, 78.5583],
          "secunderabad": [17.4399, 78.4983],
          "banjara hills": [17.4156, 78.4347],
          "jubilee hills": [17.4300, 78.4087],
          "gachibowli": [17.4401, 78.3489],
          "madhapur": [17.4483, 78.3915],
          "begumpet": [17.4375, 78.4618],
          "khairatabad": [17.4121, 78.4610],
          "abids": [17.3912, 78.4735],
          "kondapur": [17.4622, 78.3568],
          "charminar": [17.3616, 78.4747],
          "kukatpally": [17.4834, 78.4084],
          "dilsukhnagar": [17.3688, 78.5247],
          "mehdipatnam": [17.3958, 78.4312],
          "hitech city": [17.4435, 78.3772],
          "nampally": [17.3920, 78.4705],
          "habsiguda": [17.4042, 78.5361]
        };

        const matchedArea = Object.keys(AREA_COORDS).find(area => restAddrLower.includes(area));
        const coords = matchedArea 
          ? AREA_COORDS[matchedArea] 
          : (REST_COORDS[restSlug] || REST_COORDS[Object.keys(REST_COORDS).find(k => restSlug.includes(k))] || [17.4121, 78.4610]);
        
        const restaurantIcon = window.L.divIcon({
          className: 'custom-restaurant-marker',
          html: `<div class="relative flex items-center justify-center w-11 h-11 rounded-full bg-white border-2 border-red-500 shadow-md p-1 overflow-hidden transition hover:scale-115">
            <img src="${rest.logo}" class="w-full h-full object-contain rounded-full" alt="" onerror="this.src='https://img.icons8.com/fluency/96/hamburger.png'" />
          </div>`,
          iconSize: [44, 44]
        });

        const popupContent = document.createElement('div');
        popupContent.className = 'p-1.5 space-y-1.5 text-left w-36';
        const restAddress = rest.address || rest.contact?.address || '';
        popupContent.innerHTML = `
          <div class="flex items-center gap-1.5">
            <img src="${rest.logo}" class="w-6 h-6 rounded-lg object-contain p-0.5 border border-slate-100 shrink-0" />
            <div class="min-w-0 flex-1">
              <h5 class="font-extrabold text-slate-800 text-[10px] truncate leading-tight">${rest.name}</h5>
              <p class="text-[8px] text-amber-500 font-black">★ ${rest.rating || '4.8'}</p>
            </div>
          </div>
          ${restAddress ? `<p class="text-[7px] text-slate-400 leading-snug truncate flex items-center gap-0.5">📍 ${restAddress}</p>` : ''}
          <p class="text-[8px] text-slate-500 leading-snug line-clamp-2">${rest.tagline || 'Exquisite Indian takes.'}</p>
          <button
            id="map-popup-btn-${rest.id}"
            class="w-full bg-red-500 hover:bg-red-600 text-white font-extrabold text-[8px] uppercase tracking-wider py-1.5 px-2.5 rounded-lg transition cursor-pointer shadow-sm text-center border-none focus:outline-none"
          >
            Order Food
          </button>
        `;

        const marker = window.L.marker(coords, { icon: restaurantIcon })
          .addTo(markersGroup)
          .bindPopup(popupContent);

        marker.on('popupopen', () => {
          const btn = document.getElementById(`map-popup-btn-${rest.id}`);
          if (btn) {
            btn.onclick = () => {
              setSelectedRestaurant(rest);
              setStep(3);
            };
          }
        });
      });

      // Plot route automatically if From and To locations are chosen
      if (routeFrom && routeFrom.length > 2 && routeTo && routeTo.length > 2) {
        try {
          const startRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(routeFrom + ', Hyderabad, India')}`);
          const startData = await startRes.json();
          const endRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(routeTo + ', Hyderabad, India')}`);
          const endData = await endRes.json();

          let startLatLng = [17.3984, 78.5583]; // Uppal
          let endLatLng = [17.4399, 78.4983]; // Secunderabad

          if (startData && startData[0]) startLatLng = [parseFloat(startData[0].lat), parseFloat(startData[0].lon)];
          if (endData && endData[0]) endLatLng = [parseFloat(endData[0].lat), parseFloat(endData[0].lon)];

          // Plot Start Marker
          const startIcon = window.L.divIcon({
            className: 'start-marker',
            html: `<div class="relative flex items-center justify-center">
              <span class="relative inline-flex rounded-full h-5 w-5 bg-emerald-500 border-2 border-white shadow-md flex items-center justify-center text-[10px] font-black text-white">A</span>
            </div>`,
            iconSize: [20, 20]
          });
          window.L.marker(startLatLng, { icon: startIcon })
            .addTo(markersGroup)
            .bindPopup(`<strong>Start: ${routeFrom}</strong>`);

          // Plot Destination Marker
          const endIcon = window.L.divIcon({
            className: 'end-marker',
            html: `<div class="relative flex items-center justify-center">
              <span class="relative inline-flex rounded-full h-5 w-5 bg-rose-500 border-2 border-white shadow-md flex items-center justify-center text-[10px] font-black text-white">B</span>
            </div>`,
            iconSize: [20, 20]
          });
          window.L.marker(endLatLng, { icon: endIcon })
            .addTo(markersGroup)
            .bindPopup(`<strong>Destination: ${routeTo}</strong>`);

          // Query route path from OSRM
          const osrmRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${startLatLng[1]},${startLatLng[0]};${endLatLng[1]},${endLatLng[0]}?overview=full&geometries=geojson`);
          const osrmData = await osrmRes.json();

          if (osrmData.routes && osrmData.routes[0]) {
            const coordinates = osrmData.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
            if (routePolyline) {
              mapInstance.removeLayer(routePolyline);
            }
            const polyline = window.L.polyline(coordinates, {
              color: '#ef4444',
              weight: 5,
              opacity: 0.8,
              dashArray: '8, 6',
              lineCap: 'round'
            }).addTo(mapInstance);
            setRoutePolyline(polyline);
            mapInstance.fitBounds(polyline.getBounds(), { padding: [40, 40] });
          } else {
            // Draw straight fallback polyline
            const fallbackPath = [startLatLng, endLatLng];
            if (routePolyline) {
              mapInstance.removeLayer(routePolyline);
            }
            const polyline = window.L.polyline(fallbackPath, { color: '#3b82f6', weight: 4, dashArray: '6, 4' }).addTo(mapInstance);
            setRoutePolyline(polyline);
            mapInstance.fitBounds(polyline.getBounds());
          }
        } catch (err) {
          console.warn("Geocoding or polyline generation error:", err);
        }
      }
    };

    plot();
  }, [mapInstance, markersGroup, restaurants, routeCalculated, userCoords]);
  
  // --- FLOW 2: Schedule & Pick State ---
  // Uses selectedRestaurant too

  // Shared Flow States
  const [restaurantMenus, setRestaurantMenus] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [cart, setCart] = useState([]);
  const [pickupTime, setPickupTime] = useState('');
  const [pickupDate, setPickupDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  
  // Fetch menu when a restaurant is selected
  useEffect(() => {
    if (!selectedRestaurant) {
      setRestaurantMenus([]);
      setCart([]);
      return;
    }

    const fetchMenu = async () => {
      setLoadingMenu(true);
      try {
        const res = await apiRequest(`/restaurant/public/${selectedRestaurant.slug}`);
        if (res.success && Array.isArray(res.menus)) {
          // Format dishes to match standard menu item format
          const formatted = res.menus.map(m => ({
            id: m._id,
            name: m.name,
            price: m.price,
            discountPrice: m.discountPrice || null,
            description: m.description || '',
            image: m.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop',
            foodType: m.foodType || 'veg'
          }));
          setRestaurantMenus(formatted);
        }
      } catch (err) {
        console.error("Error loading restaurant menus:", err);
      } finally {
        setLoadingMenu(false);
      }
    };

    fetchMenu();
  }, [selectedRestaurant]);

  // Calculate route restaurants
  const [isSpawningRoute, setIsSpawningRoute] = useState(false);
  const calculateRoute = () => {
    if (!routeFrom || !routeTo) return;
    setRouteCalculated(true);
    
    const AREA_COORDS = {
      "uppal": [17.3984, 78.5583],
      "secunderabad": [17.4399, 78.4983],
      "banjara hills": [17.4156, 78.4347],
      "jubilee hills": [17.4300, 78.4087],
      "gachibowli": [17.4401, 78.3489],
      "madhapur": [17.4483, 78.3915],
      "begumpet": [17.4375, 78.4618],
      "khairatabad": [17.4121, 78.4610],
      "abids": [17.3912, 78.4735],
      "kondapur": [17.4622, 78.3568],
      "charminar": [17.3616, 78.4747],
      "kukatpally": [17.4834, 78.4084],
      "dilsukhnagar": [17.3688, 78.5247],
      "mehdipatnam": [17.3958, 78.4312],
      "hitech city": [17.4435, 78.3772],
      "nampally": [17.3920, 78.4705],
      "habsiguda": [17.4042, 78.5361]
    };

    const startLatLng = AREA_COORDS[routeFrom.toLowerCase()] || [17.3984, 78.5583];
    const endLatLng = AREA_COORDS[routeTo.toLowerCase()] || [17.4399, 78.4983];

    // Helper to calculate distance in km using Haversine formula
    const getDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2); 
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      return R * c;
    };

    // Filter restaurants that are physically near the route (within 8 km of start or end)
    const filtered = restaurants.filter(rest => {
      const restSlug = rest.slug?.toLowerCase();
      const restAddress = (rest.address || rest.contact?.address || '').toLowerCase();
      const matchedArea = Object.keys(AREA_COORDS).find(area => restAddress.includes(area));
      const restCoords = matchedArea 
        ? AREA_COORDS[matchedArea] 
        : (REST_COORDS[restSlug] || [17.4121, 78.4610]);

      const distFromStart = getDistance(restCoords[0], restCoords[1], startLatLng[0], startLatLng[1]);
      const distFromEnd = getDistance(restCoords[0], restCoords[1], endLatLng[0], endLatLng[1]);
      
      return distFromStart < 8 || distFromEnd < 8;
    });

    const selected = filtered.map((rest, idx) => {
      const restSlug = rest.slug?.toLowerCase();
      const restAddress = (rest.address || rest.contact?.address || '').toLowerCase();
      const matchedArea = Object.keys(AREA_COORDS).find(area => restAddress.includes(area));
      const restCoords = matchedArea 
        ? AREA_COORDS[matchedArea] 
        : (REST_COORDS[restSlug] || [17.4121, 78.4610]);

      const distFromStart = getDistance(restCoords[0], restCoords[1], startLatLng[0], startLatLng[1]);
      const roundedDist = Math.round(distFromStart * 10) / 10;
      
      const pickupTimes = ["12 mins", "15 mins", "18 mins", "20 mins"];
      const prepTimes = ["8 mins", "10 mins", "12 mins", "15 mins"];
      
      return {
        ...rest,
        distanceFromRoute: `${roundedDist} km`,
        estimatedPickupTime: pickupTimes[idx % pickupTimes.length],
        prepTime: prepTimes[idx % prepTimes.length]
      };
    });
    
    // Sort selected restaurants from closest to furthest from start
    selected.sort((a, b) => parseFloat(a.distanceFromRoute) - parseFloat(b.distanceFromRoute));

    setNearbyRestaurants(selected);
  };

  // Cart operations
  const addToCart = (item) => {
    const existing = cart.find(i => i.id === item.id);
    if (existing) {
      setCart(cart.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId) => {
    const existing = cart.find(i => i.id === itemId);
    if (!existing) return;
    if (existing.quantity === 1) {
      setCart(cart.filter(i => i.id !== itemId));
    } else {
      setCart(cart.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i));
    }
  };

  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.discountPrice || item.price) * item.quantity, 0);
  }, [cart]);

  const gstAmount = useMemo(() => {
    return Math.round((cartSubtotal * 0.05) * 100) / 100;
  }, [cartSubtotal]);

  const cartTotal = useMemo(() => {
    return cartSubtotal + gstAmount;
  }, [cartSubtotal, gstAmount]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Handle final checkout and real Razorpay payment
  const handlePlaceOrder = async () => {
    if (cart.length === 0 || !customerName || !customerPhone || !pickupTime) return;
    setPlacingOrder(true);

    const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();

    try {
      // 1. Create order in MongoDB backend
      const orderBody = {
        restaurantId: selectedRestaurant.id,
        customerName,
        customerPhone,
        items: cart.map(i => ({
          menuItem: i.id,
          name: i.name,
          quantity: i.quantity,
          price: i.discountPrice || i.price
        })),
        tableNo: '', // Route/Scheduled orders have no dine-in table!
        notes: selectedFlow === 'route' 
          ? `Route: ${routeFrom} to ${routeTo}` 
          : `Scheduled Pickup for Date: ${pickupDate}`,
        paymentMethod: 'online',
        orderType: selectedFlow === 'schedule' ? 'scheduled' : selectedFlow,
        pickupTime: selectedFlow === 'route' ? pickupTime : `${pickupDate} ${pickupTime}`,
        pickupCode: generatedOtp,
        preparationStatus: 'Pending',
        routeFrom: selectedFlow === 'route' ? routeFrom : '',
        routeTo: selectedFlow === 'route' ? routeTo : '',
        routeETA: selectedFlow === 'route' ? (selectedRestaurant.estimatedPickupTime || '20 mins') : ''
      };

      const orderRes = await apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify(orderBody)
      });

      if (!orderRes.success || !orderRes.order) {
        throw new Error(orderRes.error || "Failed to submit order to database");
      }

      const dbOrder = orderRes.order;

      // 2. Create Razorpay order on backend
      const rzRes = await apiRequest('/payments/create-order', {
        method: 'POST',
        body: JSON.stringify({ orderId: dbOrder._id })
      });

      if (!rzRes.success) {
        throw new Error(rzRes.error || "Failed to initialize payment gateway order");
      }

      // 3. Fallback to mock verification if sandbox/isMock is returned
      if (rzRes.isMock) {
        const verifyRes = await apiRequest('/payments/verify', {
          method: 'POST',
          body: JSON.stringify({
            orderId: dbOrder._id,
            isMock: true,
            razorpay_order_id: `mock_order_${Math.random().toString(36).substring(5)}`,
            razorpay_payment_id: `mock_pay_${Math.random().toString(36).substring(5)}`
          })
        });

        if (verifyRes.success && verifyRes.order) {
          finalizeSuccessfulOrder(verifyRes.order);
        } else {
          throw new Error("Mock payment confirmation failed.");
        }
        return;
      }

      // 4. Load Razorpay Checkout SDK script
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error("Razorpay SDK failed to load. Please check your internet connection.");
      }

      // 5. Open Razorpay payment gateway options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_SvUtKarWsVwcCy',
        amount: rzRes.amount,
        currency: rzRes.currency || 'INR',
        name: selectedRestaurant.name,
        description: `Pre-Order settlement via Razorpay Standard Checkout`,
        order_id: rzRes.id,
        handler: async function (response) {
          console.log("Razorpay checkout completed, verifying on backend...");
          try {
            const verifyRes = await apiRequest('/payments/verify', {
              method: 'POST',
              body: JSON.stringify({
                orderId: dbOrder._id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                isMock: false
              })
            });

            if (verifyRes.success && verifyRes.order) {
              finalizeSuccessfulOrder(verifyRes.order);
            } else {
              alert("Payment verification failed on server.");
              setPlacingOrder(false);
            }
          } catch (err) {
            alert("Verification request failed: " + err.message);
            setPlacingOrder(false);
          }
        },
        prefill: {
          name: customerName,
          contact: customerPhone
        },
        theme: {
          color: selectedRestaurant.theme?.primaryColor || '#ff385c'
        },
        modal: {
          ondismiss: function () {
            console.log("Checkout modal dismissed by user");
            alert("Payment cancelled by user.");
            setPlacingOrder(false);
          }
        }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response) {
        console.error("Razorpay checkout error:", response.error);
        alert(response.error.description || "Checkout payment failed.");
        setPlacingOrder(false);
      });
      
      rzp1.open();
    } catch (err) {
      console.error(err);
      alert("Checkout failed: " + err.message);
      setPlacingOrder(false);
    }
  };

  const finalizeSuccessfulOrder = (verifiedOrder) => {
    const confirmedOrder = {
      id: verifiedOrder._id,
      restaurantId: selectedRestaurant.id,
      customerName: verifiedOrder.customerName,
      customerPhone: verifiedOrder.customerPhone,
      items: cart,
      tableNo: '',
      subTotal: verifiedOrder.subTotal,
      gstAmount: verifiedOrder.gstAmount,
      deliveryCharge: 0,
      totalAmount: verifiedOrder.totalAmount,
      paymentMethod: 'online',
      paymentStatus: 'PAID',
      orderStatus: 'placed',
      createdAt: verifiedOrder.createdAt,
      orderType: selectedFlow === 'schedule' ? 'scheduled' : selectedFlow,
      pickupTime: verifiedOrder.pickupTime,
      pickupCode: verifiedOrder.pickupCode,
      preparationStatus: 'Pending',
      routeFrom: verifiedOrder.routeFrom,
      routeTo: verifiedOrder.routeTo,
      routeETA: verifiedOrder.routeETA
    };

    setOrders([confirmedOrder, ...orders]);
    setCompletedOrder(confirmedOrder);
    setStep(5); // Move to Success Screen
    setPlacingOrder(false);
  };

  const handleReset = () => {
    setSelectedFlow(null);
    setStep(1);
    setRouteCalculated(false);
    setNearbyRestaurants([]);
    setSelectedRestaurant(null);
    setCart([]);
    setPickupTime('');
    setCompletedOrder(null);
    if (routePolyline && mapInstance) {
      mapInstance.removeLayer(routePolyline);
    }
    setRoutePolyline(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Page Title Header */}
      {!selectedFlow && (
        <div className="text-center space-y-3 mb-12">
        <div className="w-48 h-48 mx-auto flex items-center justify-center">
          <DotLottieReact
            src="https://lottie.host/81591f8c-c23c-4669-8d46-44c80177579a/ffRnLuLBJF.lottie"
            loop
            autoplay
          />
        </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
            Choose How You Want to Order
          </h1>
          <p className="max-w-xl mx-auto text-sm text-slate-500">
            Skip the queues and pre-order your meals. Select the option that matches your travel or schedule needs.
          </p>
        </div>
      )}

      {/* Main Choice Dashboard */}
      {!selectedFlow && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Card 1: Route Order */}
          <div className="bg-white border border-slate-200/60 rounded-[24px] shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between text-left group overflow-hidden">
            <div className="relative h-48 w-full overflow-hidden bg-slate-100 shrink-0">
              <img 
                src={routeMapImage} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                alt="Route Order Map"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
            </div>
            
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                    Route Order
                  </h3>
                  <p className="text-sm font-semibold text-slate-400">
                    Order food while travelling and pick it up on your route without waiting.
                  </p>
                </div>
                {/* Features List */}
                <ul className="space-y-2.5 pt-2 text-xs font-bold text-slate-500">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Choose start location & destination</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Discover registered restaurants along your route</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Check route distance & food preparation delays</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Pre-order food & select instant pickup ETA</span>
                  </li>
                </ul>
              </div>
              
              <button 
                onClick={() => { setSelectedFlow('route'); setStep(1); }}
                className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow transition-colors cursor-pointer text-sm"
              >
                <span>Explore Route Orders</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card 2: Schedule & Pick */}
          <div className="bg-white border border-slate-200/60 rounded-[24px] shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between text-left group overflow-hidden">
            <div className="relative h-48 w-full overflow-hidden bg-slate-100 shrink-0">
              <img 
                src={scheduleOrderImage} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                alt="Schedule Order Clock"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
            </div>
            
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                    Schedule & Pick
                  </h3>
                  <p className="text-sm font-semibold text-slate-400">
                    Schedule your order in advance and pick it up exactly when needed.
                  </p>
                </div>
                {/* Features List */}
                <ul className="space-y-2.5 pt-2 text-xs font-bold text-slate-500">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Select any of our partner restaurants</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Browse full digital catalog menu</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Choose custom date & time slot for pickup</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Real-time countdown reminder notifications</span>
                  </li>
                </ul>
              </div>
              
              <button 
                onClick={() => { setSelectedFlow('schedule'); setStep(1); }}
                className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow transition-colors cursor-pointer text-sm"
              >
                <span>Schedule Order</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- WIZARD FLOW INTERFACES --- */}
      {selectedFlow && (
        <div className="bg-white border border-slate-200/60 rounded-[32px] p-6 sm:p-8 shadow-lg max-w-6xl mx-auto">
          {/* Header of Wizard */}
          <div className="flex justify-between items-center pb-6 border-b border-slate-100 mb-6">
            <button 
              onClick={step === 1 ? handleReset : () => setStep(step - 1)}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <div className="text-right">
              <span className="text-[10px] bg-red-500/10 text-red-500 border border-red-500/20 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                {selectedFlow === 'route' ? '🚗 Route Order' : '⏰ Schedule & Pick'}
              </span>
              <p className="text-xs font-bold text-slate-400 mt-1">Step {step} of 5</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* -------------------- ROUTE ORDER FLOW -------------------- */}

            {/* Route Order Step 1: Input Route */}
            {selectedFlow === 'route' && step === 1 && (
              <motion.div key="route-s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
                <div className="lg:col-span-5 space-y-6 order-2 lg:order-1">
                  <div>
                    <h3 className="text-xl font-black text-slate-800">Where are you travelling?</h3>
                    <p className="text-xs text-slate-400 mt-1">Specify your start location and destination to map nearby food stops.</p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Start Location (From)</label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                        <input 
                          type="text" 
                          value={routeFrom} 
                          onChange={(e) => { setRouteFrom(e.target.value); setShowFromSuggestions(true); }}
                          onFocus={() => setShowFromSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowFromSuggestions(false), 250)}
                          className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl py-3 pl-10 pr-4 text-xs font-bold focus:outline-none focus:border-red-500 text-slate-800"
                          placeholder="Search Hyderabad area..."
                        />
                        {/* Dropdown Suggestions */}
                        {showFromSuggestions && (
                          <div className="absolute left-0 right-0 mt-1.5 max-h-48 overflow-y-auto bg-white border border-slate-200/80 rounded-2xl shadow-xl z-50 p-1 space-y-0.5 text-slate-800 custom-scrollbar">
                            {HYD_AREAS.filter(area => area.toLowerCase().includes(routeFrom.toLowerCase())).map(area => (
                              <button
                                key={area}
                                type="button"
                                onMouseDown={() => {
                                  setRouteFrom(area);
                                  setShowFromSuggestions(false);
                                }}
                                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition"
                              >
                                📍 {area}, Hyderabad
                              </button>
                            ))}
                            {HYD_AREAS.filter(area => area.toLowerCase().includes(routeFrom.toLowerCase())).length === 0 && (
                              <div className="px-3.5 py-2 text-xs font-bold text-slate-400">No matching Hyderabad areas</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Destination (To)</label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-rose-500" />
                        <input 
                          type="text" 
                          value={routeTo} 
                          onChange={(e) => { setRouteTo(e.target.value); setShowToSuggestions(true); }}
                          onFocus={() => setShowToSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowToSuggestions(false), 250)}
                          className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl py-3 pl-10 pr-4 text-xs font-bold focus:outline-none focus:border-red-500 text-slate-800"
                          placeholder="Search Hyderabad area..."
                        />
                        {/* Dropdown Suggestions */}
                        {showToSuggestions && (
                          <div className="absolute left-0 right-0 mt-1.5 max-h-48 overflow-y-auto bg-white border border-slate-200/80 rounded-2xl shadow-xl z-50 p-1 space-y-0.5 text-slate-800 custom-scrollbar">
                            {HYD_AREAS.filter(area => area.toLowerCase().includes(routeTo.toLowerCase())).map(area => (
                              <button
                                key={area}
                                type="button"
                                onMouseDown={() => {
                                  setRouteTo(area);
                                  setShowToSuggestions(false);
                                }}
                                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition"
                              >
                                📍 {area}, Hyderabad
                              </button>
                            ))}
                            {HYD_AREAS.filter(area => area.toLowerCase().includes(routeTo.toLowerCase())).length === 0 && (
                              <div className="px-3.5 py-2 text-xs font-bold text-slate-400">No matching Hyderabad areas</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {!routeCalculated ? (
                    <button 
                      onClick={calculateRoute}
                      className="w-full bg-red-500 hover:bg-red-600 text-white font-extrabold py-3.5 px-6 rounded-2xl text-xs transition shadow-md cursor-pointer border-none focus:outline-none"
                    >
                      Find Nearby Restaurants
                    </button>
                  ) : (
                    <div className="space-y-5 pt-2">
                      {/* Location Route Info Card */}
                      <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-3 shadow-sm text-slate-800">
                        <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
                          <Navigation className="w-4 h-4 text-red-500 animate-pulse" />
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Mapped Travel Route</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-bold px-1">
                          <div className="flex flex-col text-left">
                            <span className="text-[8px] text-slate-400 font-extrabold uppercase">From</span>
                            <span className="text-slate-800 font-black truncate max-w-[120px]">{routeFrom}</span>
                          </div>
                          <div className="flex-1 flex items-center justify-center px-3">
                            <div className="w-full border-t-2 border-dashed border-red-300 relative flex justify-center items-center">
                              <span className="absolute bg-white px-2 py-0.5 border border-red-100 rounded-full text-[8px] text-red-500 font-extrabold shrink-0">Pre-order Path</span>
                            </div>
                          </div>
                          <div className="flex flex-col text-right">
                            <span className="text-[8px] text-slate-400 font-extrabold uppercase">To</span>
                            <span className="text-slate-800 font-black truncate max-w-[120px]">{routeTo}</span>
                          </div>
                        </div>
                      </div>

                      {/* Nearby Partner Restaurants Section */}
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center px-1">
                          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Nearby Eateries ({nearbyRestaurants.length})</span>
                          <span className="text-[8px] text-emerald-600 font-extrabold bg-emerald-500/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">Detected along path</span>
                        </div>
                        
                        <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                          {nearbyRestaurants.length === 0 ? (
                            <div className="text-center py-8 text-xs font-bold text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-white p-4">
                              No partner outlets located directly along this path.
                            </div>
                          ) : (
                            nearbyRestaurants.map((rest) => (
                              <div 
                                key={rest.id}
                                className="bg-white border border-slate-200/80 rounded-2xl p-2.5 flex items-center gap-3 hover:border-red-400/80 transition-all hover:shadow-sm"
                              >
                                <img 
                                  src={rest.logo} 
                                  className="w-8.5 h-8.5 rounded-xl border border-slate-100 object-contain p-1 bg-slate-50 shrink-0" 
                                  alt={rest.name} 
                                />
                                <div className="flex-1 min-w-0 text-left">
                                  <h5 className="font-extrabold text-[11px] text-slate-800 truncate flex items-center gap-1.5 justify-between">
                                    <span>{rest.name}</span>
                                    <span className="text-[9px] text-amber-500 font-extrabold shrink-0">★ {rest.rating || '4.8'}</span>
                                  </h5>
                                  <div className="flex gap-2 text-[9px] text-slate-400 font-semibold mt-0.5">
                                    <span>ETA: {rest.estimatedPickupTime}</span>
                                    <span>•</span>
                                    <span>{rest.distanceFromRoute} off-route</span>
                                  </div>
                                  {(rest.address || rest.contact?.address) && (
                                    <div className="flex items-center gap-0.5 text-[8px] text-slate-400 font-semibold mt-0.5 truncate">
                                      <MapPin className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                                      <span className="truncate">{rest.address || rest.contact?.address}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="space-y-2.5 pt-1">
                        <button 
                          onClick={() => setStep(2)}
                          className="w-full bg-red-500 hover:bg-red-600 text-white font-black py-3.5 px-6 rounded-2xl text-xs transition shadow-md cursor-pointer flex items-center justify-center gap-1.5 border-none focus:outline-none active:scale-[0.98]"
                        >
                          <span>Explore</span>
                          <ArrowRight className="w-4 h-4 animate-bounce" />
                        </button>
                        
                        <button 
                          onClick={() => { setRouteCalculated(false); setNearbyRestaurants([]); }}
                          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 px-6 rounded-2xl text-xs transition border border-slate-200 cursor-pointer text-center focus:outline-none"
                        >
                          Modify Route Points
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Live OpenStreetMap Leaflet Map Column */}
                <div className="lg:col-span-7 bg-slate-900 rounded-[32px] flex flex-col justify-between text-white relative min-h-[380px] lg:min-h-[480px] shadow-lg border border-slate-800 overflow-hidden order-1 lg:order-2">
                  
                  {/* Map Header Overlay */}
                  <div className="absolute top-4 left-4 z-20 bg-slate-950/80 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 text-left space-y-0.5 pointer-events-none shadow-md">
                    <span className="text-[9px] bg-teal-400/20 text-teal-300 border border-teal-400/30 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">Live Map Tracker</span>
                    <h4 className="text-xs font-black">OpenStreetMap Route Corridor</h4>
                  </div>
                  
                  {/* Map Container */}
                  {!leafletLoaded ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950/95 text-slate-400 gap-3 min-h-[380px] lg:min-h-[480px]">
                      <Loader message="Initializing Live Map..." size="w-20 h-20" dark={true} />
                    </div>
                  ) : (
                    <div id="leaflet-travel-map" className="w-full h-full min-h-[380px] lg:min-h-[480px] z-10" />
                  )}
                  
                  {/* Map Footer Overlay */}
                  <div className="absolute bottom-4 left-4 z-20 bg-slate-950/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/5 pointer-events-none text-[9px] text-slate-400 shadow-md">
                    * Click any food stop marker on map to order instantly!
                  </div>
                </div>
              </motion.div>
            )}

            {/* Route Order Step 2: Show Restaurants along Route */}
            {selectedFlow === 'route' && step === 2 && (
              <motion.div key="route-s2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 text-left">
                <div>
                  <h3 className="text-xl font-black text-slate-800">Eateries along your route</h3>
                  <p className="text-xs text-slate-400 mt-1">Select an outlet to customize and schedule your pre-order.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {nearbyRestaurants.map((rest) => (
                    <div 
                      key={rest.id} 
                      onClick={() => { setSelectedRestaurant(rest); setStep(3); }}
                      className="bg-white border border-slate-200 hover:border-red-500 rounded-3xl p-5 shadow-sm hover:shadow-md cursor-pointer transition flex gap-4 group"
                    >
                      <img 
                        src={rest.logo} 
                        className="w-14 h-14 rounded-2xl border border-slate-100 object-contain p-1.5 shrink-0 bg-slate-50"
                        alt={rest.name} 
                      />
                      <div className="space-y-1.5 text-left flex-1 min-w-0">
                        <h4 className="font-extrabold text-slate-900 truncate flex items-center justify-between">
                          <span>{rest.name}</span>
                          <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0">
                            {rest.distanceFromRoute} Off Route
                          </span>
                        </h4>
                        <p className="text-[10px] text-slate-500 truncate">{rest.tagline || 'Exquisite Indian cuisine'}</p>
                        {(rest.address || rest.contact?.address) && (
                          <div className="flex items-center gap-1 text-[9px] text-slate-400 font-semibold">
                            <MapPin className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span className="truncate">{rest.address || rest.contact?.address}</span>
                          </div>
                        )}
                        
                        <div className="flex gap-4 pt-1 text-[10px] text-slate-400 font-bold">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            ETA: {rest.estimatedPickupTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <Utensils className="w-3.5 h-3.5 text-slate-400" />
                            Prep: {rest.prepTime}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-center shrink-0 text-slate-300 group-hover:text-red-500 transition">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                  ))}

                  {nearbyRestaurants.length === 0 && (
                    <div className="col-span-2 text-center py-12 space-y-2 border border-dashed border-slate-200 rounded-3xl">
                      <p className="text-sm font-bold text-slate-400">No restaurants matching the route yet.</p>
                      <button onClick={handleReset} className="text-xs text-red-500 font-bold hover:underline">Reset flow</button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}


            {/* -------------------- SCHEDULE & PICK FLOW -------------------- */}

            {/* Schedule Order Step 1: Select Restaurant */}
            {selectedFlow === 'schedule' && step === 1 && (
              <motion.div key="schedule-s1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 text-left">
                <div>
                  <h3 className="text-xl font-black text-slate-800">Select a Restaurant</h3>
                  <p className="text-xs text-slate-400 mt-1">Pick a restaurant from active partners to schedule your pickup order.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {restaurants.map((rest) => (
                    <div 
                      key={rest.id} 
                      onClick={() => { setSelectedRestaurant(rest); setStep(3); }}
                      className="bg-white border border-slate-200 hover:border-red-500 rounded-3xl p-5 shadow-sm hover:shadow-md cursor-pointer transition flex gap-4 group"
                    >
                      <img 
                        src={rest.logo} 
                        className="w-14 h-14 rounded-2xl border border-slate-100 object-contain p-1.5 shrink-0 bg-slate-50"
                        alt={rest.name} 
                      />
                      <div className="space-y-1.5 text-left flex-1 min-w-0">
                        <h4 className="font-extrabold text-slate-900 truncate flex items-center justify-between">
                          <span>{rest.name}</span>
                          <span className="text-[10px] text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            {rest.rating || '5.0'}
                          </span>
                        </h4>
                        <p className="text-[10px] text-slate-500 truncate">{rest.tagline || 'Exquisite Indian cuisine'}</p>
                        {(rest.address || rest.contact?.address) && (
                          <div className="flex items-center gap-1 text-[9px] text-slate-400 font-semibold">
                            <MapPin className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span className="truncate">{rest.address || rest.contact?.address}</span>
                          </div>
                        )}
                        <p className="text-[10px] text-slate-400 font-bold">
                          Timings: {rest.timings.open} - {rest.timings.close}
                        </p>
                      </div>
                      <div className="flex items-center justify-center shrink-0 text-slate-300 group-hover:text-red-500 transition">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* -------------------- SHARED FOOD SELECTION STEP (STEP 3) -------------------- */}
            {step === 3 && selectedRestaurant && (
              <motion.div key="shared-s3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 text-left">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <img src={selectedRestaurant.logo} className="w-10 h-10 rounded-xl border border-slate-100 object-contain p-1" alt="" />
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">{selectedRestaurant.name} Menu</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {selectedFlow === 'route' ? `Route Order stop • ${selectedRestaurant.estimatedPickupTime} Pickup` : 'Advance scheduling'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Cart Total Counter */}
                  <div className="bg-red-500 text-white px-4 py-2 rounded-2xl flex items-center gap-2 shadow-sm font-bold text-xs">
                    <ShoppingBag className="w-4 h-4" />
                    <span>{cart.reduce((s, i) => s + i.quantity, 0)} Items</span>
                    <span className="border-l border-white/20 pl-2">₹{cartSubtotal}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Menu Dishes List */}
                  <div className="lg:col-span-2 space-y-4 max-h-[450px] overflow-y-auto pr-2 no-scrollbar">
                    {loadingMenu ? (
                      <div className="flex justify-center items-center py-12 w-full">
                        <Loader message="Fetching restaurant menu..." size="w-20 h-20" />
                      </div>
                    ) : restaurantMenus.length === 0 ? (
                      <p className="text-center text-xs text-slate-400 py-8">No dishes currently uploaded for this partner.</p>
                    ) : (
                      restaurantMenus.map(item => {
                        const cartItem = cart.find(i => i.id === item.id);
                        return (
                          <div key={item.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex gap-3 items-center hover:bg-slate-100/50 transition">
                            <img src={item.image} className="w-16 h-16 rounded-xl object-cover" alt="" />
                            <div className="flex-1 min-w-0 text-left space-y-1">
                              <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-bold text-white ${item.foodType === 'veg' ? 'bg-green-600' : 'bg-red-600'}`}>
                                {item.foodType}
                              </span>
                              <h4 className="text-xs font-bold text-slate-800 leading-tight truncate">{item.name}</h4>
                              <p className="text-[10px] text-slate-400 truncate">{item.description}</p>
                              <p className="text-xs font-extrabold text-slate-900">₹{item.price}</p>
                            </div>

                            {/* Add Buttons */}
                            <div className="shrink-0">
                              {cartItem ? (
                                <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5">
                                  <button onClick={() => removeFromCart(item.id)} className="px-2.5 py-1 text-slate-500 font-extrabold hover:bg-slate-50 rounded-lg text-xs">-</button>
                                  <span className="px-2 text-xs font-black text-slate-800">{cartItem.quantity}</span>
                                  <button onClick={() => addToCart(item)} className="px-2.5 py-1 text-slate-500 font-extrabold hover:bg-slate-50 rounded-lg text-xs">+</button>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => addToCart(item)}
                                  className="bg-red-500 hover:bg-red-600 text-white font-extrabold text-[11px] px-4 py-2 rounded-xl transition"
                                >
                                  Add
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Cart Sidebar Preview */}
                  <div className="bg-slate-50 rounded-3xl p-5 border border-slate-100 flex flex-col justify-between min-h-[300px]">
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Cart Summary</h4>
                      {cart.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-12">Your cart is currently empty. Add dishes from the menu to continue.</p>
                      ) : (
                        <div className="space-y-3 max-h-[220px] overflow-y-auto">
                          {cart.map(item => (
                            <div key={item.id} className="flex justify-between text-xs font-bold text-slate-600">
                              <span className="truncate max-w-[120px]">{item.name} x{item.quantity}</span>
                              <span>₹{(item.discountPrice || item.price) * item.quantity}</span>
                            </div>
                          ))}
                          <div className="border-t border-slate-200/60 pt-3 space-y-1.5 text-xs">
                            <div className="flex justify-between text-slate-400">
                              <span>Subtotal</span>
                              <span>₹{cartSubtotal}</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                              <span>GST (5%)</span>
                              <span>₹{gstAmount}</span>
                            </div>
                            <div className="flex justify-between font-extrabold text-slate-800 text-sm pt-1 border-t border-dashed border-slate-200">
                              <span>Total</span>
                              <span>₹{cartTotal}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      disabled={cart.length === 0}
                      onClick={() => setStep(4)}
                      className={`w-full py-3.5 rounded-2xl font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 ${
                        cart.length > 0 
                          ? 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer' 
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <span>Proceed to Schedule</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* -------------------- DATE / TIME & CHECKOUT DETAILS (STEP 4) -------------------- */}
            {step === 4 && selectedRestaurant && (
              <motion.div key="shared-s4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 text-left max-w-xl mx-auto">
                <div>
                  <h3 className="text-xl font-black text-slate-800">Scheduling & Checkout</h3>
                  <p className="text-xs text-slate-400 mt-1">Finalize your pickup schedule timing and customer identification details.</p>
                </div>

                <div className="space-y-4">
                  {/* Route Order Schedule Details */}
                  {selectedFlow === 'route' && (
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                      <div className="text-[10px] text-red-500 font-extrabold uppercase tracking-wider flex items-center gap-1">
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Recommended Pickup Slots</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Based on your travel speed, you are estimated to cross <strong>{selectedRestaurant.name}</strong> in {selectedRestaurant.estimatedPickupTime}.
                      </p>
                      
                      <div className="grid grid-cols-2 gap-2">
                        {["20 mins", "35 mins", "50 mins", "65 mins"].map((eta) => {
                          const futureTime = new Date(Date.now() + parseInt(eta) * 60 * 1000);
                          const timeStr = futureTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                          return (
                            <button
                              key={eta}
                              type="button"
                              onClick={() => setPickupTime(timeStr)}
                              className={`py-2 px-3 border rounded-xl text-xs font-bold transition ${
                                pickupTime === timeStr
                                  ? 'bg-red-500 text-white border-red-500 shadow-sm'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {timeStr} (in {eta})
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Scheduled Pick Schedule Details */}
                  {selectedFlow === 'schedule' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Pickup Date</label>
                        <div className="relative">
                          <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                          <input 
                            type="date"
                            value={pickupDate}
                            onChange={(e) => setPickupDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl py-3 pl-10 pr-4 text-xs font-bold focus:outline-none focus:border-red-500 text-slate-800"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Pickup Time</label>
                        <div className="relative">
                          <Clock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                          <input 
                            type="time"
                            value={pickupTime}
                            onChange={(e) => setPickupTime(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl py-3 pl-10 pr-4 text-xs font-bold focus:outline-none focus:border-red-500 text-slate-800"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Manual Time Input for Route (Alternative if custom is needed) */}
                  {selectedFlow === 'route' && (
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Custom Arrival Time</label>
                      <input 
                        type="time" 
                        value={pickupTime.includes(':') ? pickupTime : ''}
                        onChange={(e) => setPickupTime(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl py-3 px-4 text-xs font-bold focus:outline-none focus:border-red-500 text-slate-800"
                      />
                    </div>
                  )}

                  {/* Customer Information */}
                  <div className="space-y-4 pt-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Customer Name</label>
                      <input 
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="e.g. Ramesh Kumar"
                        className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl py-3 px-4 text-xs font-bold focus:outline-none focus:border-red-500 text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Phone Number</label>
                      <input 
                        type="tel"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="e.g. +91 99887 76655"
                        className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl py-3 px-4 text-xs font-bold focus:outline-none focus:border-red-500 text-slate-800"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-between items-center text-xs">
                  <span className="font-extrabold text-slate-800 text-sm">
                    Amount Payable: <strong className="text-red-500 font-black">₹{cartTotal}</strong>
                  </span>

                  <button
                    disabled={placingOrder || !customerName || !customerPhone || !pickupTime}
                    onClick={handlePlaceOrder}
                    className={`py-3.5 px-6 rounded-2xl font-bold text-xs shadow-md transition flex items-center gap-1.5 ${
                      !placingOrder && customerName && customerPhone && pickupTime
                        ? 'bg-red-500 hover:bg-red-600 text-white cursor-pointer' 
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {placingOrder ? (
                      <span>Placing Order...</span>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        <span>Pay Online (Simulate)</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* -------------------- SUCCESS / ORDER CONFIRMATION STATE (STEP 5) -------------------- */}
            {step === 5 && completedOrder && (
              <motion.div key="shared-s5" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-6 text-center max-w-md mx-auto py-6">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">Pre-Order Placed Successfully!</h3>
                  <p className="text-xs text-slate-400 leading-relaxed px-4">
                    Your order is confirmed. The restaurant has received your scheduling requirements and is initiating preparation timelines.
                  </p>
                </div>

                {/* OTP & QR Code Container */}
                <div className="bg-[#fcf8ec] border border-amber-500/20 rounded-3xl p-6 space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-amber-600 font-extrabold uppercase tracking-wider block">Pickup OTP Code</span>
                    <h4 className="text-3xl font-black text-slate-800 tracking-wider">
                      {completedOrder.pickupCode || '4820'}
                    </h4>
                  </div>
                  
                  {/* Fake QR code representation */}
                  <div className="bg-white p-3 rounded-2xl inline-block shadow-sm">
                    <svg className="w-24 h-24" viewBox="0 0 100 100">
                      <rect width="10" height="10" x="5" y="5" fill="black" />
                      <rect width="10" height="10" x="85" y="5" fill="black" />
                      <rect width="10" height="10" x="5" y="85" fill="black" />
                      <rect width="5" height="5" x="20" y="20" fill="black" />
                      <rect width="10" height="5" x="40" y="10" fill="black" />
                      <rect width="5" height="10" x="70" y="30" fill="black" />
                      <rect width="10" height="10" x="30" y="50" fill="black" />
                      <rect width="5" height="5" x="60" y="60" fill="black" />
                      <rect width="10" height="5" x="15" y="70" fill="black" />
                      <rect width="5" height="10" x="75" y="70" fill="black" />
                    </svg>
                  </div>

                  <p className="text-[10px] text-amber-700 font-semibold leading-normal">
                    * Show this OTP code or scan the QR code at the counter for instant food release.
                  </p>
                </div>

                {/* Order Details Details */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left text-xs space-y-2 text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Order ID</span>
                    <span className="font-mono text-[10px]">#{completedOrder.id?.slice(-8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Restaurant</span>
                    <span className="font-bold text-slate-800">{selectedRestaurant.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Pickup Time</span>
                    <span className="font-bold text-slate-800">{completedOrder.pickupTime}</span>
                  </div>
                  {completedOrder.orderType === 'route' && (
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">Travel Corridor</span>
                      <span className="font-bold text-slate-800">{completedOrder.routeFrom} ➔ {completedOrder.routeTo}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-200/60 pt-2 font-extrabold text-slate-800">
                    <span>Total Amount Paid</span>
                    <span>₹{completedOrder.totalAmount}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleReset}
                    className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs transition"
                  >
                    Place Another Order
                  </button>
                  
                  <button
                    onClick={() => setCurrentView('landing')}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold border border-slate-200 rounded-2xl text-xs transition"
                  >
                    Go back Home
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
