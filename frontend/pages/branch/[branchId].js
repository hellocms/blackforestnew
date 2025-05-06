import React, { useState, useEffect, useRef } from "react";
import { Layout, Button, Space, Row, Col, message, Image, Radio, Badge, Tooltip, Select, Dropdown, Menu, Input } from "antd";
import { LogoutOutlined, AccountBookFilled, ShoppingCartOutlined, MenuOutlined, ArrowLeftOutlined, CheckCircleFilled, PlusOutlined, MinusOutlined, CloseOutlined, WalletOutlined, CreditCardOutlined, SaveOutlined, PrinterOutlined, UserOutlined } from "@ant-design/icons";
import { useRouter } from "next/router";
import { jwtDecode as jwtDecodeLib } from "jwt-decode";

const { Header, Content, Sider } = Layout;
const { Option } = Select;

const BillingPage = ({ branchId }) => {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [name, setName] = useState("Branch User");
  const [branchName, setBranchName] = useState("");
  const [isCartExpanded, setIsCartExpanded] = useState(false);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProductType, setSelectedProductType] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [contentWidth, setContentWidth] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [selectedUnits, setSelectedUnits] = useState({});
  const [lastBillNo, setLastBillNo] = useState(null);
  const [cashiers, setCashiers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [selectedCashier, setSelectedCashier] = useState(null);
  const [selectedManager, setSelectedManager] = useState(null);
  const [todayAssignment, setTodayAssignment] = useState({});
  const [waiterInput, setWaiterInput] = useState("");
  const [waiterName, setWaiterName] = useState("");
  const [waiterError, setWaiterError] = useState("");
  const [selectedWaiter, setSelectedWaiter] = useState(null);
  const [waiters, setWaiters] = useState([]);
  const [touchStartX, setTouchStartX] = useState(null);

  const contentRef = useRef(null);
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://apib.dinasuvadu.in';

  // Fetch Functions
  const fetchBranchDetails = async (token, branchId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/branches`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const branch = data.find(b => b._id === branchId);
        if (branch) {
          setBranchName(branch.name || 'Unknown Branch');
        } else {
          message.error('Branch not found');
          setBranchName('Unknown Branch');
        }
      } else {
        message.error('Failed to fetch branches');
        setBranchName('Unknown Branch');
      }
    } catch (error) {
      console.error('Fetch branches error:', error);
      message.error('Error fetching branches');
      setBranchName('Unknown Branch');
    }
  };

  const fetchCategories = async (token) => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/categories/list-categories`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) setCategories(data);
      else message.error('Failed to fetch categories');
    } catch (error) {
      message.error('Error fetching categories');
    }
    setLoading(false);
  };

  const fetchEmployees = async (token, team, setter) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/employees?team=${team}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        const filteredEmployees = data.filter(employee => employee.status === 'Active');
        setter(filteredEmployees);
      } else {
        message.error(`Failed to fetch ${team}s`);
      }
    } catch (error) {
      message.error(`Error fetching ${team}s`);
    }
  };

  const fetchTodayAssignment = async (token) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/daily-assignments/${branchId}/today`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setTodayAssignment(data);
        if (data.cashierId) setSelectedCashier(data.cashierId._id);
        if (data.managerId) setSelectedManager(data.managerId._id);
      } else {
        message.error('Failed to fetch today\'s assignment');
      }
    } catch (error) {
      message.error('Error fetching today\'s assignment');
    }
  };

  const fetchProducts = async (categoryId) => {
    setProductsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/products`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        const filteredProducts = data.filter(product => product.category?._id === categoryId);
        setProducts(filteredProducts);
        applyFilters(filteredProducts);
      } else {
        message.error('Failed to fetch products');
        setProducts([]);
        setFilteredProducts([]);
      }
    } catch (error) {
      message.error('Error fetching products');
      setProducts([]);
      setFilteredProducts([]);
    }
    setProductsLoading(false);
  };

  // Helper Functions
  const applyFilters = (productList) => {
    let filtered = productList;
    if (selectedProductType) {
      filtered = filtered.filter(product => product.productType === selectedProductType);
    }
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredProducts(filtered);
  };

  const handleSearch = (value) => {
    setSearchQuery(value);
    if (selectedCategory) {
      applyFilters(products);
    }
  };

  const handleProductTypeFilter = (type) => {
    setSelectedProductType(type);
    if (selectedCategory) {
      applyFilters(products);
    }
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setSelectedProductType(null);
    setSearchQuery("");
    fetchProducts(category._id);
    setSelectedUnits({});
  };

  const handleUnitChange = (productId, unitIndex) => {
    setSelectedUnits(prev => ({
      ...prev,
      [productId]: unitIndex,
    }));
  };

  const stopPropagation = (e) => {
    e.stopPropagation();
  };

  const handleProductClick = (product) => {
    const selectedUnitIndex = selectedUnits[product._id] || 0;
    setSelectedProducts(prev => {
      const existingProduct = prev.find(item => item._id === product._id && item.selectedUnitIndex === selectedUnitIndex);
      const gstRate = product.priceDetails?.[selectedUnitIndex]?.gst || "non-gst";
      if (existingProduct) {
        return prev.map(item =>
          item._id === product._id && item.selectedUnitIndex === selectedUnitIndex
            ? { ...item, count: item.count + 1 }
            : item
        );
      } else {
        return [...prev, { 
          ...product, 
          selectedUnitIndex, 
          count: 1, 
          bminstock: 0,
          gstRate
        }];
      }
    });
  };

  const handleIncreaseCount = (productId, selectedUnitIndex) => {
    setSelectedProducts(prev => {
      return prev.map(item =>
        item._id === productId && item.selectedUnitIndex === selectedUnitIndex
          ? { ...item, count: item.count + 1 }
          : item
      );
    });
  };

  const handleDecreaseCount = (productId, selectedUnitIndex) => {
    setSelectedProducts(prev => {
      const existingProduct = prev.find(item => item._id === productId && item.selectedUnitIndex === selectedUnitIndex);
      if (existingProduct.count === 1) {
        return prev.filter(item => !(item._id === productId && item.selectedUnitIndex === selectedUnitIndex));
      } else {
        return prev.map(item =>
          item._id === productId && item.selectedUnitIndex === selectedUnitIndex
            ? { ...item, count: item.count - 1 }
            : item
        );
      }
    });
  };

  const handleRemoveProduct = (productId, selectedUnitIndex) => {
    setSelectedProducts(prev => {
      return prev.filter(item => !(item._id === productId && item.selectedUnitIndex === selectedUnitIndex));
    });
    setLastBillNo(null);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setProducts([]);
    setFilteredProducts([]);
    setSelectedProductType(null);
    setSearchQuery("");
    setSelectedUnits({});
    setLastBillNo(null);
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    setToken(null);
    setName('Branch User');
    router.replace('/login');
  };

  const handleCartToggle = () => {
    setIsCartExpanded(!isCartExpanded);
    message.info(`Cart ${isCartExpanded ? 'collapsed' : 'expanded'}`);
    setTimeout(() => {
      if (contentRef.current) {
        setContentWidth(contentRef.current.getBoundingClientRect().width);
      }
    }, 0);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleSwipe = (e) => {
    if (!selectedCategory) return;

    const touch = e.changedTouches[0];
    const swipeDistance = touch.clientX - touchStartX;
    if (swipeDistance > 50) { // Swipe right threshold
      handleBackToCategories();
    }
  };

  const handleWaiterInputChange = async (value) => {
    setWaiterInput(value);
    setWaiterError("");
    setWaiterName("");
    setSelectedWaiter(null);

    if (!value) return;

    const waiter = waiters.find(w => w.employeeId === `E${value.padStart(3, '0')}`);
    if (waiter) {
      setWaiterName(waiter.name);
      setSelectedWaiter(waiter);
    } else {
      setWaiterError("Waiter not found");
    }
  };

  const handleSave = async () => {
    if (selectedProducts.length === 0) {
      message.warning('Cart is empty!');
      return;
    }
    if (!paymentMethod) {
      message.warning('Please select a payment method!');
      return;
    }

    const { totalQty, uniqueItems, subtotal, totalGST, totalWithGST } = calculateCartTotals();

    const orderData = {
      branchId,
      tab: 'billing',
      products: selectedProducts.map(product => {
        const gstRate = product.priceDetails?.[product.selectedUnitIndex]?.gst || "non-gst";
        return {
          productId: product._id,
          name: product.name,
          quantity: product.count,
          price: product.priceDetails?.[product.selectedUnitIndex]?.price || 0,
          unit: product.priceDetails?.[product.selectedUnitIndex]?.unit || '',
          gstRate: gstRate,
          productTotal: calculateProductTotal(product),
          productGST: gstRate === "non-gst" ? 0 : calculateProductGST(product),
          bminstock: product.bminstock || 0,
        };
      }),
      paymentMethod,
      subtotal,
      totalGST,
      totalWithGST,
      totalItems: uniqueItems,
      status: 'draft',
      waiterId: selectedWaiter?._id || null,
    };

    try {
      const response = await fetch(`${BACKEND_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();
      if (response.ok) {
        message.success(data.message || 'Cart saved as draft!');
        setLastBillNo(data.order.billNo);
        setSelectedProducts([]);
        setWaiterInput("");
        setWaiterName("");
        setWaiterError("");
        setSelectedWaiter(null);
      } else {
        message.error(data.message || 'Failed to save order');
      }
    } catch (error) {
      message.error('Error saving order');
    }
  };

  const handleSaveAndPrint = async () => {
    if (selectedProducts.length === 0) {
      message.warning('Cart is empty!');
      return;
    }
    if (!paymentMethod) {
      message.warning('Please select a payment method!');
      return;
    }

    const { totalQty, uniqueItems, subtotal, totalGST, totalWithGST } = calculateCartTotals();

    const totalWithGSTRounded = Math.round(totalWithGST);
    const roundOff = totalWithGSTRounded - totalWithGST;
    const tenderAmount = totalWithGSTRounded;
    const balance = tenderAmount - totalWithGSTRounded;
    const sgst = totalGST / 2;
    const cgst = totalGST / 2;

    const orderData = {
      branchId,
      tab: 'billing',
      products: selectedProducts.map(product => {
        const gstRate = product.priceDetails?.[product.selectedUnitIndex]?.gst || "non-gst";
        return {
          productId: product._id,
          name: product.name,
          quantity: product.count,
          price: product.priceDetails?.[product.selectedUnitIndex]?.price || 0,
          unit: product.priceDetails?.[product.selectedUnitIndex]?.unit || '',
          gstRate: gstRate,
          productTotal: calculateProductTotal(product),
          productGST: gstRate === "non-gst" ? 0 : calculateProductGST(product),
          bminstock: product.bminstock || 0,
        };
      }),
      paymentMethod,
      subtotal,
      totalGST,
      totalWithGST,
      totalItems: uniqueItems,
      status: 'completed',
      waiterId: selectedWaiter?._id || null,
    };

    try {
      const response = await fetch(`${BACKEND_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();
      if (response.ok) {
        message.success(data.message || 'Cart saved and ready to print!');
        setLastBillNo(data.order.billNo);
        printReceipt(data.order, todayAssignment, {
          totalQty,
          totalItems: uniqueItems,
          subtotal,
          sgst,
          cgst,
          totalWithGST,
          totalWithGSTRounded,
          roundOff,
          paymentMethod,
          tenderAmount,
          balance,
        });
        setSelectedProducts([]);
        setWaiterInput("");
        setWaiterName("");
        setWaiterError("");
        setSelectedWaiter(null);
      } else {
        message.error(data.message || 'Failed to save and print order');
      }
    } catch (error) {
      message.error('Error saving and printing order');
    }
  };

  const handleClearCart = () => {
    setSelectedProducts([]);
    setWaiterInput("");
    setWaiterName("");
    setWaiterError("");
    setSelectedWaiter(null);
    setPaymentMethod(null);
    setLastBillNo(null);
    message.info('Cart cleared');
  };

  const printReceipt = (order, todayAssignment, summary) => {
    const { totalQty, subtotal, totalWithGSTRounded } = summary;
    const { sgst, cgst } = summary;
    const totalGST = sgst + cgst;
    const dateTime = new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).replace(',', '');

    const waiterInfo = selectedWaiter
      ? `${selectedWaiter.name} (${selectedWaiter.employeeId})`
      : order.waiterId
      ? `${order.waiterId.name}${order.waiterId.employeeId ? ` (${order.waiterId.employeeId})` : ''}`
      : 'Not Assigned';

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body { 
              font-family: 'Courier New', Courier, monospace; 
              width: 302px; 
              margin: 0; 
              padding: 5px; 
              font-size: 12px; 
              line-height: 1.3; 
              color: #000; 
              font-weight: bold; 
            }
            h1 { 
              text-align: center; 
              font-size: 18px; 
              font-weight: bold; 
              margin: 0 0 3px 0; 
              color: #000; 
            }
            .header { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 5px; 
              width: 100%; 
              color: #000; 
              font-weight: bold; 
            }
            .header-left { 
              text-align: left; 
              max-width: 50%; 
              overflow: hidden; 
              text-overflow: ellipsis; 
              color: #000; 
              font-weight: bold; 
            }
            .header-right { 
              text-align: right; 
              max-width: 50%; 
              color: #000; 
              font-weight: bold; 
            }
            .header-right p.waiter { 
              white-space: normal; 
              overflow: visible; 
              text-overflow: clip; 
            }
            p { 
              margin: 2px 0; 
              overflow: hidden; 
              text-overflow: ellipsis; 
              color: #000; 
              font-weight: bold; 
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 5px; 
              color: #000; 
              font-weight: bold; 
            }
            th, td { 
              padding: 5px 2px; 
              text-align: left; 
              font-size: 12px; 
              color: #000; 
              font-weight: bold; 
              vertical-align: top; 
            }
            th { 
              font-weight: bold; 
              color: #000; 
            }
            .divider { 
              border-top: 1px dashed #000; 
              margin: 5px 0; 
            }
            .summary { 
              margin-top: 5px; 
              color: #000; 
              font-weight: bold; 
            }
            .summary div {
              display: flex;
              justify-content: flex-end;
              white-space: nowrap;
              color: #000;
              font-weight: bold;
              font-size: 12px;
            }
            .summary div span {
              color: #000;
              font-weight: bold;
              font-size: 12px;
            }
            .summary div span:first-child {
              margin-right: 5px;
            }
            .grand-total {
              font-weight: 900;
              font-size: 22px;
              color: #000;
              margin-top: 10px;
              padding-top: 5px;
              border-top: 1px dashed #000;
              display: flex;
              justify-content: flex-end;
              border-bottom: 1px dashed #000;
              padding-bottom: 5px;
              margin-bottom: 10px;
            }
            .grand-total span:first-child {
              font-size: 1.5em;
              margin-right: 5px;
            }
            .grand-total span:last-child {
              font-size: 1.5em;
            }
            .thank-you {
              text-align: center;
              margin-top: 10px;
              color: #000;
              font-weight: bold;
              font-size: 14px;
            }
            @media print { 
              @page { 
                margin: 0; 
                size: 80mm auto; 
              } 
              body { 
                margin: 0; 
                padding: 5px; 
                width: 302px; 
              } 
            }
          </style>
        </head>
        <body>
          <h1>${order.branchId?.name || 'Unknown Branch'}</h1>
          <p style="text-align: center;">${order.branchId?.address || 'Address Not Available'}</p>
          <p style="text-align: center;">Phone: ${order.branchId?.phoneNo || 'Phone Not Available'}</p>
          <p style="text-align: center;">Bill No: ${order.billNo}</p>
          <div class="header">
            <div class="header-left">
              <p>Date: ${dateTime}</p>
              <p>Manager: ${todayAssignment?.managerId?.name || 'Not Assigned'}</p>
            </div>
            <div class="header-right">
              <p>Cashier: ${todayAssignment?.cashierId?.name || 'Not Assigned'}</p>
              <p class="waiter">Waiter: ${waiterInfo}</p>
            </div>
          </div>
          <div class="divider"></div>
          <table>
            <thead>
              <tr>
                <th style="width: 50%;">Item</th>
                <th style="width: 15%; text-align: right;">Qty</th>
                <th style="width: 15%; text-align: right;">Price</th>
                <th style="width: 20%; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${order.products
                .map(
                  (product) => `
                  <tr>
                    <td style="white-space: normal; word-break: break-word; vertical-align: top; padding-right: 10px;">
                      ${product.name} (${product.quantity}${product.unit}${
                    product.cakeType
                      ? `, ${product.cakeType === 'freshCream' ? 'FC' : 'BC'}`
                      : ''
                  })
                    </td>
                    <td style="text-align: right; vertical-align: top; padding-right: 10px;">${product.quantity}</td>
                    <td style="text-align: right; vertical-align: top; padding-right: 10px;">₹${product.price.toFixed(
                      2
                    )}</td>
                    <td style="text-align: right; vertical-align: top;">₹${product.productTotal.toFixed(
                      2
                    )}</td>
                  </tr>
                `
                )
                .join('')}
            </tbody>
          </table>
          <div class="divider"></div>
          <div class="summary">
            <div><span style="font-weight: bold; font-size: 12px;">Total Qty: ${totalQty.toFixed(
              2
            )}</span><span style="font-weight: bold; font-size: 12px;">Total Amount: ₹${subtotal.toFixed(
              2
            )}</span></div>
            ${
              totalGST > 0
                ? `
                <div style="display: flex; justify-content: flex-end;"><span style="font-weight: bold; font-size: 12px;">SGST:</span><span style="font-weight: bold; font-size: 12px;">₹${sgst.toFixed(
                  2
                )}</span></div>
                <div style="display: flex; justify-content: flex-end;"><span style="font-weight: bold; font-size: 12px;">CGST:</span><span style="font-weight: bold; font-size: 12px;">₹${cgst.toFixed(
                  2
                )}</span></div>
              `
                : ''
            }
            <div class="grand-total">
              <span>Grand Total:</span>
              <span>₹${totalWithGSTRounded.toFixed(2)}</span>
            </div>
          </div>
          <p class="thank-you">Thank You !! Visit Again</p>
        </body>
      </html>
    `);
    doc.close();

    iframe.contentWindow.focus();
    iframe.contentWindow.print();

    iframe.contentWindow.onafterprint = () => {
      document.body.removeChild(iframe);
    };

    setTimeout(() => {
      if (iframe.parentNode) {
        document.body.removeChild(iframe);
      }
    }, 1000);
  };

  const getCardSize = () => {
    if (typeof window === 'undefined') return 200;
    if (window.innerWidth >= 1600) return 200;
    if (window.innerWidth >= 1400) return 180;
    if (window.innerWidth >= 1200) return 160;
    if (window.innerWidth >= 992) return 150;
    if (window.innerWidth >= 768) return isPortrait ? 140 : 150;
    if (window.innerWidth >= 576) return isPortrait ? 120 : 130;
    return isPortrait ? 100 : 110;
  };

  const formatPriceDetails = (priceDetails, selectedUnitIndex = 0) => {
    if (!priceDetails || priceDetails.length === 0 || typeof selectedUnitIndex !== 'number') return 'No Price';
    const detail = priceDetails[selectedUnitIndex];
    return `₹${detail.price}`;
  };

  const formatUnitLabel = (detail, productType) => {
    const baseLabel = `${detail.quantity}${detail.unit}`;
    if (productType === 'cake' && detail.cakeType) {
      const cakeTypeLabel = detail.cakeType === 'freshCream' ? 'FC' : 'BC';
      return `${baseLabel} (${cakeTypeLabel})`;
    }
    return baseLabel;
  };

  const formatTooltip = (detail, productType) => {
    const baseTooltip = `Unit: ${detail.quantity}${detail.unit}, GST: ${detail.gst}%`;
    if (productType === 'cake' && detail.cakeType) {
      const cakeTypeLabel = detail.cakeType === 'freshCream' ? 'FC' : 'BC';
      return `${baseTooltip}, Type: ${cakeTypeLabel}`;
    }
    return baseTooltip;
  };

  const formatDisplayName = (product) => {
    const detail = product.priceDetails?.[product.selectedUnitIndex];
    if (!detail) return product.name;
    const baseName = `${product.name} (${detail.quantity}${detail.unit}${product.productType === 'cake' && detail.cakeType ? `, ${detail.cakeType === 'freshCream' ? 'FC' : 'BC'}` : ''})`;
    return baseName;
  };

  const calculateProductTotal = (product) => {
    if (!product.priceDetails || product.priceDetails.length === 0) return 0;
    const selectedUnitIndex = product.selectedUnitIndex || 0;
    const price = product.priceDetails[selectedUnitIndex]?.price || 0;
    return price * product.count;
  };

  const calculateProductGST = (product) => {
    const productTotal = calculateProductTotal(product);
    const selectedUnitIndex = product.selectedUnitIndex || 0;
    const gstRate = product.priceDetails?.[selectedUnitIndex]?.gst || "non-gst";
    if (gstRate === "non-gst" || typeof gstRate !== 'number') return 0;
    return productTotal * (gstRate / 100);
  };

  const calculateCartTotals = () => {
    const totalQty = selectedProducts.reduce((sum, product) => sum + product.count, 0);
    const uniqueItems = selectedProducts.length;
    const subtotal = selectedProducts.reduce((sum, product) => sum + calculateProductTotal(product), 0);
    const totalGST = selectedProducts.reduce((sum, product) => sum + calculateProductGST(product), 0);
    const totalWithGST = subtotal + totalGST;
    return { totalQty, uniqueItems, subtotal, totalGST, totalWithGST };
  };

  const saveAssignment = async () => {
    if (!selectedCashier && !selectedManager) {
      message.warning('Please select at least one cashier or manager');
      return;
    }
    try {
      const response = await fetch(`${BACKEND_URL}/api/daily-assignments/${branchId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          cashierId: selectedCashier,
          managerId: selectedManager,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        message.success(data.message || 'Assignment saved successfully');
        setTodayAssignment(data.assignment);
      } else {
        message.error(data.message || 'Failed to save assignment');
      }
    } catch (error) {
      message.error('Error saving assignment');
    }
  };

  // useEffect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      setToken(storedToken);

      if (!storedToken) {
        router.replace('/login');
        return;
      }

      try {
        const decoded = jwtDecodeLib(storedToken);
        if (decoded.role !== 'branch') {
          router.replace('/login');
          return;
        }
        setName(decoded.name || decoded.username || "Branch User");
        setBranchName('Unknown Branch'); // Updated default
      } catch (error) {
        console.error('Error decoding token:', error);
        router.replace('/login');
      }

      fetchBranchDetails(storedToken, branchId);
      fetchCategories(storedToken);
      fetchEmployees(storedToken, 'Cashier', setCashiers);
      fetchEmployees(storedToken, 'Manager', setManagers);
      fetchEmployees(storedToken, 'Waiter', setWaiters);
      fetchTodayAssignment(storedToken);

      setIsMobile(window.innerWidth <= 991);
      setIsPortrait(window.matchMedia("(orientation: portrait)").matches);

      const updateContentWidth = () => {
        if (contentRef.current) {
          setContentWidth(contentRef.current.getBoundingClientRect().width);
        }
      };

      updateContentWidth();
      window.addEventListener("resize", updateContentWidth);

      const handleOrientationChange = (e) => {
        setIsPortrait(e.matches);
        setIsMobileMenuOpen(false);
        updateContentWidth();
      };

      const mediaQuery = window.matchMedia("(orientation: portrait)");
      mediaQuery.addEventListener("change", handleOrientationChange);

      const handleResize = () => {
        setIsMobile(window.innerWidth <= 991);
        updateContentWidth();
      };

      window.addEventListener("resize", handleResize);

      return () => {
        mediaQuery.removeEventListener("change", handleOrientationChange);
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [router, branchId]);

  const { totalQty, uniqueItems, subtotal, totalGST, totalWithGST } = calculateCartTotals();

  const userMenu = (
    <div style={{ padding: '10px', background: '#fff', borderRadius: '4px', width: '300px' }}>
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Select Cashier:</label>
        <Select
          value={selectedCashier}
          onChange={(value) => setSelectedCashier(value)}
          style={{ width: '100%' }}
          placeholder="Select a cashier"
          allowClear
        >
          {cashiers.length > 0 ? (
            cashiers.map(cashier => (
              <Option key={cashier._id} value={cashier._id}>
                {cashier.name}
              </Option>
            ))
          ) : (
            <Option disabled value={null}>No cashiers available</Option>
          )}
        </Select>
        {todayAssignment.cashierId && (
          <p style={{ marginTop: '5px', color: '#888' }}>
            Today's Cashier: {todayAssignment.cashierId.name}
          </p>
        )}
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Select Manager:</label>
        <Select
          value={selectedManager}
          onChange={(value) => setSelectedManager(value)}
          style={{ width: '100%' }}
          placeholder="Select a manager"
          allowClear
        >
          {managers.length > 0 ? (
            managers.map(manager => (
              <Option key={manager._id} value={manager._id}>
                {manager.name}
              </Option>
            ))
          ) : (
            <Option disabled value={null}>No managers available</Option>
          )}
        </Select>
        {todayAssignment.managerId && (
          <p style={{ marginTop: '5px', color: '#888' }}>
            Today's Manager: {todayAssignment.managerId.name}
          </p>
        )}
      </div>

      <Button type="primary" onClick={saveAssignment} block style={{ marginBottom: '15px' }}>
        Confirm Assignment
      </Button>
    </div>
  );

  const cardSize = getCardSize();
  const gutter = 16;
  const columns = contentWidth > 0 ? Math.floor(contentWidth / (cardSize + gutter)) : 1;
  const fontSize = isPortrait && window.innerWidth <= 575 ? 10 : Math.max(cardSize * 0.1, 12);
  const lineHeight = Math.max(cardSize * 0.3, 20);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          background: "#000000",
          padding: "0 20px",
          color: "#FFFFFF",
          height: "64px",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        }}
      >
        {/* Left Section */}
        <div style={{ display: "flex", alignItems: "center" }}>
          {/* Mobile Navigation on Left */}
          <div style={{ display: isPortrait || isMobile ? "flex" : "none", alignItems: "center" }}>
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={toggleMobileMenu}
              style={{
                fontSize: "18px",
                color: "#FFFFFF",
                marginRight: "10px",
              }}
            />
          </div>

          {/* User Info */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <Space align="center">
              <span style={{ fontSize: "14px", color: "#FFFFFF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "150px" }}>
                {branchName}
              </span>
              <Dropdown overlay={userMenu} trigger={['click']}>
                <Button
                  type="text"
                  icon={<UserOutlined />}
                  style={{
                    fontSize: "16px",
                    color: "#FFFFFF",
                    padding: "0 10px",
                  }}
                >
                  {isPortrait || isMobile ? null : "Manager"}
                </Button>
              </Dropdown>
              <Button
                type="text"
                icon={<AccountBookFilled />}
                onClick={() => router.push('/branch/account')}
                style={{
                  fontSize: "16px",
                  color: "#FFFFFF",
                  padding: "0 10px",
                }}
              >
                {isPortrait || isMobile ? null : "Account"}
              </Button>
            </Space>
          </div>
        </div>

        {/* Desktop Center Section with Search Bar */}
        <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
          {selectedCategory && !(isPortrait || isMobile) && (
            <Input
              placeholder="Search products by name"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              style={{
                width: '100%',
                maxWidth: '600px',
                height: '40px',
                fontSize: '16px',
                borderRadius: '8px',
                background: '#fff',
                color: '#000',
              }}
            />
          )}
        </div>

        {/* Right Section */}
        <div style={{ display: "flex", alignItems: "center" }}>
          {/* Mobile Cart on Right */}
          <div style={{ display: isPortrait || isMobile ? "flex" : "none", alignItems: "center" }}>
            <Badge count={selectedProducts.length} showZero>
              <Button
                type="text"
                icon={<ShoppingCartOutlined />}
                onClick={handleCartToggle}
                style={{
                  fontSize: "24px",
                  color: "#FFFFFF",
                  marginRight: "10px",
                }}
              />
            </Badge>
          </div>

          {/* Desktop Version */}
          <div
            style={{
              display: isPortrait || isMobile ? "none" : "flex",
              alignItems: "center",
            }}
          >
            <Space align="center">
              <Button
                type={selectedProductType === null ? "primary" : "text"}
                onClick={() => handleProductTypeFilter(null)}
                style={{ color: "#FFFFFF", marginRight: '10px' }}
              >
                All
              </Button>
              <Button
                type={selectedProductType === 'cake' ? "primary" : "text"}
                onClick={() => handleProductTypeFilter('cake')}
                style={{ color: "#FFFFFF", marginRight: '10px' }}
              >
                Cake
              </Button>
              <Button
                type={selectedProductType === 'non-cake' ? "primary" : "text"}
                onClick={() => handleProductTypeFilter('non-cake')}
                style={{ color: "#FFFFFF", marginRight: '10px' }}
              >
                Non-Cake
              </Button>
              <Badge count={selectedProducts.length} showZero>
                <Button
                  type="text"
                  icon={<ShoppingCartOutlined />}
                  onClick={handleCartToggle}
                  style={{
                    fontSize: "24px",
                    color: "#FFFFFF",
                    marginRight: '10px',
                  }}
                />
              </Badge>
              <Button
                type="text"
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                style={{
                  fontSize: "16px",
                  color: "#FFFFFF",
                }}
              >
                Logout
              </Button>
            </Space>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (isPortrait || isMobile) && (
          <div
            style={{
              position: "fixed",
              top: "64px",
              left: 0,
              width: "100%",
              background: "#FFFFFF",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
              zIndex: 999,
              padding: "10px 20px",
              color: "#000000",
            }}
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              <Button
                type={selectedProductType === null ? "primary" : "text"}
                onClick={() => {
                  handleProductTypeFilter(null);
                  toggleMobileMenu();
                }}
                style={{ width: "100%", textAlign: "left", color: selectedProductType === null ? "#FFFFFF" : "#000000" }}
              >
                All
              </Button>
              <Button
                type={selectedProductType === 'cake' ? "primary" : "text"}
                onClick={() => {
                  handleProductTypeFilter('cake');
                  toggleMobileMenu();
                }}
                style={{ width: "100%", textAlign: "left", color: selectedProductType === 'cake' ? "#FFFFFF" : "#000000" }}
              >
                Cake
              </Button>
              <Button
                type={selectedProductType === 'non-cake' ? "primary" : "text"}
                onClick={() => {
                  handleProductTypeFilter('non-cake');
                  toggleMobileMenu();
                }}
                style={{ width: "100%", textAlign: "left", color: selectedProductType === 'non-cake' ? "#FFFFFF" : "#000000" }}
              >
                Non-Cake
              </Button>
              <Button
                type="text"
                icon={<LogoutOutlined />}
                onClick={() => {
                  handleLogout();
                  toggleMobileMenu();
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  color: "#000000",
                }}
              >
                Logout
              </Button>
            </Space>
          </div>
        )}
      </Header>

      <Layout style={{ flex: 1, marginTop: '64px' }}>
        <Content
          ref={contentRef}
          style={{
            padding: '20px',
            background: '#FFFFFF',
            flex: isCartExpanded ? '80%' : '100%',
            minHeight: 'calc(100vh - 64px)',
            position: 'relative',
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleSwipe}
        >
          <div style={{ marginBottom: '20px' }}>
            {selectedCategory ? (
              <>
                <Button
                  type="text"
                  icon={<ArrowLeftOutlined />}
                  onClick={handleBackToCategories}
                  style={{
                    position: 'absolute',
                    left: '20px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '24px',
                    color: '#000000',
                    zIndex: 1,
                  }}
                />
                {productsLoading ? (
                  <div>Loading products...</div>
                ) : (
                  <Row gutter={[16, 24]} justify="center">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map(product => (
                        <Col
                          key={product._id}
                          span={24 / columns}
                          style={{ display: 'flex', justifyContent: 'center' }}
                        >
                          {renderProductCard(product)}
                        </Col>
                      ))
                    ) : (
                      <div>No products found for this category.</div>
                    )}
                  </Row>
                )}
              </>
            ) : (
              <>
                <h2 style={{ color: '#000000', marginBottom: '15px' }}>Billing</h2>
                <Row gutter={[16, 24]} justify="center">
                  {loading ? (
                    <div>Loading categories...</div>
                  ) : categories.length > 0 ? (
                    categories.map(category => (
                      <Col
                        key={category._id}
                        span={24 / columns}
                        style={{ display: 'flex', justifyContent: 'center' }}
                      >
                        <div
                          style={{
                            width: cardSize,
                            height: cardSize,
                            borderRadius: 8,
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                            cursor: 'pointer',
                          }}
                          onClick={() => handleCategoryClick(category)}
                        >
                          <div style={{ width: '100%', height: '100%', overflow: 'hidden', padding: 0, margin: 0 }}>
                            {category.image ? (
                              <Image
                                src={`${BACKEND_URL}/${category.image}`}
                                alt={category.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', padding: 0, margin: 0 }}
                                preview={false}
                              />
                            ) : (
                              <div style={{ width: '100%', height: '100%', background: '#E9E9E9', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 0, margin: 0 }}>No Image</div>
                            )}
                          </div>
                          <div style={{ width: '100%', background: '#000000', textAlign: 'center', padding: 0, margin: 0 }}>
                            <span
                              style={{
                                color: '#FFFFFF',
                                fontSize: `${fontSize}px`,
                                fontWeight: 'bold',
                                padding: 0,
                                margin: 0,
                                display: 'block',
                                lineHeight: `${lineHeight}px`,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {category.name}
                            </span>
                          </div>
                        </div>
                      </Col>
                    ))
                  ) : (
                    <div>No categories found</div>
                  )}
                </Row>
              </>
            )}
          </div>
        </Content>

        <Sider
          collapsed={!isCartExpanded}
          width={400}
          trigger={null}
          style={{
            background: '#FFFFFF',
            boxShadow: '-2px 0 4px rgba(0, 0, 0, 0.1)',
            display: isCartExpanded ? 'block' : 'none',
          }}
        >
          <div
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              padding: '20px',
              color: '#000000',
              textAlign: 'left',
            }}
          >
            <div style={{ flex: '0 0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0 }}>Cart</h3>
                {lastBillNo && (
                  <p style={{ margin: 0, fontWeight: 'bold' }}>
                    Last Bill No: {lastBillNo}
                  </p>
                )}
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Enter Waiter ID:</label>
                <Input
                  value={waiterInput}
                  onChange={(e) => handleWaiterInputChange(e.target.value)}
                  placeholder="Enter waiter ID (e.g., 4 for E004)"
                  style={{ width: '100%' }}
                />
                {waiterName && (
                  <p style={{ marginTop: '5px', color: '#52c41a' }}>
                    Waiter: {waiterName}
                  </p>
                )}
                {waiterError && (
                  <p style={{ marginTop: '5px', color: '#ff4d4f' }}>
                    {waiterError}
                  </p>
                )}
              </div>
            </div>
            <div
              style={{
                flex: '1 1 auto',
                overflowY: 'auto',
                marginBottom: '20px',
                paddingBottom: '20px',
              }}
            >
              {selectedProducts.length > 0 ? (
                <ul style={{ listStyleType: 'none', padding: 0 }}>
                  {selectedProducts.map(product => {
                    const gstRate = product.priceDetails?.[product.selectedUnitIndex]?.gst || "non-gst";
                    return (
                      <li
                        key={`${product._id}-${product.selectedUnitIndex}`}
                        style={{ marginBottom: '30px', fontSize: '14px', display: 'flex', flexDirection: 'column' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ flex: 1, fontWeight: 'bold' }}>
                            {formatDisplayName(product)}{gstRate === "non-gst" ? " (Non-GST)" : ""}
                          </span>
                          <span style={{ flex: 1, textAlign: 'right' }}>
                            {formatPriceDetails(product.priceDetails, product.selectedUnitIndex)} x {product.count}
                          </span>
                          <Button
                            type="text"
                            icon={<CloseOutlined />}
                            onClick={() => handleRemoveProduct(product._id, product.selectedUnitIndex)}
                            style={{
                              width: '24px',
                              height: '24px',
                              minWidth: '24px',
                              padding: 0,
                              fontSize: '14px',
                              color: '#ff4d4f',
                              backgroundColor: '#fff',
                              border: '2px solid #ff4d4f',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginLeft: '10px',
                            }}
                          />
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginTop: '10px',
                            paddingBottom: '5px',
                            borderBottom: '1px dotted #d9d9d9',
                          }}
                        >
                          <Space size="middle">
                            <Button
                              type="default"
                              icon={<MinusOutlined />}
                              onClick={() => handleDecreaseCount(product._id, product.selectedUnitIndex)}
                              size="small"
                              style={{ backgroundColor: '#ff4d4f', color: '#ffffff' }}
                            />
                            <span>{product.count}</span>
                            <Button
                              type="default"
                              icon={<PlusOutlined />}
                              onClick={() => handleIncreaseCount(product._id, product.selectedUnitIndex)}
                              size="small"
                              style={{ backgroundColor: '#95BF47', color: '#ffffff' }}
                            />
                          </Space>
                          <span style={{ fontWeight: 'bold' }}>
                            ₹{calculateProductTotal(product)}
                            {gstRate !== "non-gst" && ` + ₹${calculateProductGST(product).toFixed(2)} GST`}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p>No products selected.</p>
              )}
            </div>
            {selectedProducts.length > 0 && (
              <div
                style={{
                  flex: '0 0 auto',
                  position: 'sticky',
                  bottom: 0,
                  background: '#FFFFFF',
                  paddingTop: '10px',
                  borderTop: '1px solid #d9d9d9',
                  zIndex: 1,
                }}
              >
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', marginBottom: '5px' }}>
                    <span>Total (Excl. GST)</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', marginBottom: '5px' }}>
                    <span>GST</span>
                    <span>₹{totalGST.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '16px', fontWeight: 'bold' }}>
                    <span>Total (Incl. GST)</span>
                    <span>₹{totalWithGST.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', marginTop: '5px' }}>
                    <span>Total Items</span>
                    <span>{uniqueItems}</span>
                  </div>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <Radio.Group
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    value={paymentMethod}
                    style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Radio.Button value="cash" style={{ borderRadius: '50px', textAlign: 'center' }}>
                      <WalletOutlined /> Cash
                    </Radio.Button>
                    <Radio.Button value="nextCard" style={{ borderRadius: '50px', textAlign: 'center' }}>
                      <CreditCardOutlined /> Next Card
                    </Radio.Button>
                    <Radio.Button value="upi" style={{ borderRadius: '50px', textAlign: 'center' }}>
                      <CreditCardOutlined /> UPI
                    </Radio.Button>
                  </Radio.Group>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={handleSave}
                    style={{ flex: 1 }}
                    disabled={lastBillNo && selectedProducts.length === 0}
                  >
                    Save
                  </Button>
                  <Button
                    type="default"
                    icon={<CloseOutlined />}
                    onClick={handleClearCart}
                    style={{ flex: 1, backgroundColor: '#ff4d4f', color: '#ffffff' }}
                    disabled={selectedProducts.length === 0}
                  >
                    Clear
                  </Button>
                  <Button
                    type="primary"
                    icon={<PrinterOutlined />}
                    onClick={handleSaveAndPrint}
                    style={{ flex: 1 }}
                    disabled={lastBillNo && selectedProducts.length === 0}
                  >
                    Save & Print
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Sider>
      </Layout>
    </Layout>
  );

  function renderProductCard(product) {
    const selectedUnitIndex = selectedUnits[product._id] || 0;
    const selectedProduct = selectedProducts.find(item => item._id === product._id && item.selectedUnitIndex === selectedUnitIndex);
    const count = selectedProduct ? selectedProduct.count : 0;

    return (
      <div style={{ position: 'relative' }}>
        <div
          style={{
            width: cardSize,
            height: cardSize,
            borderRadius: 8,
            overflow: 'hidden',
            position: 'relative',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            cursor: 'pointer',
            border: count > 0 ? '3px solid #95BF47' : 'none',
          }}
          onClick={() => handleProductClick(product)}
        >
          <div
            style={{
              position: 'absolute',
              top: 5,
              right: 5,
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: product.isVeg ? 'green' : 'red',
              zIndex: 1,
            }}
          />
          {product.images?.length > 0 ? (
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <Image
                src={`${BACKEND_URL}/Uploads/${product.images[0]}`}
                alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', padding: 0, margin: 0 }}
                preview={false}
              />
            </div>
          ) : (
            <div style={{ width: '100%', height: '100%', background: '#E9E9E9', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 0, margin: 0 }}>
              No Image
            </div>
          )}
          <div
            style={{
              position: 'absolute',
              top: 5,
              left: 5,
              background: 'rgba(0, 0, 0, 0.6)',
              color: '#FFFFFF',
              fontSize: `${fontSize * 0.7}px`,
              fontWeight: 'bold',
              padding: '2px 5px',
              borderRadius: 4,
              maxWidth: '80%',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {product.name}
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: 5,
              left: 5,
              right: 5,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.6)',
                color: '#FFFFFF',
                fontSize: `${fontSize * 0.9}px`,
                fontWeight: 'bold',
                padding: '2px 5px',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              <Tooltip
                title={
                  product.priceDetails?.[selectedUnitIndex]
                    ? formatTooltip(product.priceDetails[selectedUnitIndex], product.productType)
                    : 'No Details'
                }
              >
                {formatPriceDetails(product.priceDetails, selectedUnitIndex)}
              </Tooltip>
            </div>
            <div style={{ width: '40%' }} onClick={stopPropagation}>
              <Select
                value={selectedUnitIndex}
                onChange={(value) => handleUnitChange(product._id, value)}
                size="small"
                style={{ width: '100%' }}
              >
                {product.priceDetails?.map((detail, index) => (
                  <Option key={index} value={index}>
                    {formatUnitLabel(detail, product.productType)}
                  </Option>
                ))}
              </Select>
            </div>
            {count > 0 && (
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.6)',
                  color: '#FFFFFF',
                  fontSize: `${fontSize * 0.9}px`,
                  fontWeight: 'bold',
                  padding: '2px 5px',
                  borderRadius: 4,
                }}
              >
                {count}
              </div>
            )}
          </div>
        </div>
        {count > 0 && (
          <CheckCircleFilled
            style={{
              position: 'absolute',
              top: -12,
              right: -12,
              fontSize: '24px',
              color: '#95BF47',
            }}
          />
        )}
      </div>
    );
  }
};

export async function getServerSideProps(context) {
  const { params } = context;
  const { branchId } = params;

  return {
    props: {
      branchId,
    },
  };
}

BillingPage.useLayout = false;
export default BillingPage;