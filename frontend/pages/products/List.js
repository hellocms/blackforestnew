import React, { useState, useEffect } from 'react';
import { Table, Input, Button, Space, Tag, Select, Popconfirm, message, Modal, Image, Tooltip } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined, PlusOutlined, EyeOutlined, EyeInvisibleOutlined, DownloadOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';
import { CSVLink } from 'react-csv';

const { Option } = Select;

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedPastry, setSelectedPastry] = useState(null); // ✅ Added for Pastry filter
  const [selectedStock, setSelectedStock] = useState(null);
  const [selectedVeg, setSelectedVeg] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [previewImages, setPreviewImages] = useState([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const router = useRouter();

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://apib.dinasuvadu.in';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      message.info('Please log in to view products');
      router.push('/login');
    } else {
      fetchProducts(token);
      fetchCategories(token);
    }
  }, [router]);

  // Fetch Products
  const fetchProducts = async (token) => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/products`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setProducts(data);
        setFilteredProducts(data);
      } else {
        message.error('Failed to fetch products');
      }
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      message.error('Error fetching products');
    }
    setLoading(false);
  };

  // Fetch Categories
  const fetchCategories = async (token) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/categories/list-categories`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      console.log('Categories Fetch Response (ProductList):', data);
      if (response.ok) {
        setCategories(Array.isArray(data) ? data : []);
      } else {
        message.error('Failed to fetch categories');
        setCategories([]);
      }
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      message.error('Error fetching categories');
      setCategories([]);
    }
  };

  // Handle Search
  const handleSearch = (value) => {
    setSearchText(value);
    filterProducts(value, selectedCategory, selectedPastry, selectedStock, selectedVeg, selectedType);
  };

  // Handle Filters
  const handleFilterChange = (filterType, value) => {
    if (filterType === 'category') setSelectedCategory(value);
    if (filterType === 'pastry') setSelectedPastry(value); // ✅ Handle Pastry filter
    if (filterType === 'stock') setSelectedStock(value);
    if (filterType === 'veg') setSelectedVeg(value);
    if (filterType === 'type') setSelectedType(value);
    filterProducts(
      searchText,
      filterType === 'category' ? value : selectedCategory,
      filterType === 'pastry' ? value : selectedPastry, // ✅ Pass Pastry filter
      filterType === 'stock' ? value : selectedStock,
      filterType === 'veg' ? value : selectedVeg,
      filterType === 'type' ? value : selectedType
    );
  };

  // Filter Products
  const filterProducts = (search, category, pastry, stock, veg, type) => {
    let filtered = [...products];

    if (search) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.productId.includes(search) ||
        (product.category && product.category.name.toLowerCase().includes(search.toLowerCase()))
      );
    }

    if (category !== null && category !== undefined) {
      filtered = filtered.filter(product => product.category?._id === category);
    }

    if (pastry !== null && pastry !== undefined) { // ✅ Added Pastry filter logic
      filtered = filtered.filter(product => product.isPastry === (pastry === 'pastry'));
    }

    if (stock !== null && stock !== undefined) {
      filtered = filtered.filter(product => (stock === 'inStock' ? product.inStock > 0 : product.inStock === 0));
    }

    if (veg !== null && veg !== undefined) {
      filtered = filtered.filter(product => product.isVeg === (veg === 'veg'));
    }

    if (type !== null && type !== undefined) {
      filtered = filtered.filter(product => product.productType === type);
    }

    setFilteredProducts(filtered);
  };

  // Clear Filters and Restore All Products
  const clearFilters = () => {
    setSearchText('');
    setSelectedCategory(null);
    setSelectedPastry(null); // ✅ Clear Pastry filter
    setSelectedStock(null);
    setSelectedVeg(null);
    setSelectedType(null);
    setFilteredProducts([...products]);
  };

  // Handle Delete Product
  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/products/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        message.success('✅ Product deleted successfully');
        fetchProducts(token);
      } else {
        message.error('❌ Failed to delete product');
      }
    } catch (error) {
      console.error('❌ Error deleting product:', error);
      message.error('Error deleting product');
    }
  };

  // Handle Image Preview
  const handleImagePreview = (images) => {
    setPreviewImages(images.map(img => `${BACKEND_URL}/uploads/${img}`));
    setPreviewVisible(true);
  };

  // Format Price Details (Only Price for Display, Full Details in Tooltip)
  const formatPriceDetails = (priceDetails) => {
    if (!priceDetails || priceDetails.length === 0) return 'No Price';
    const displayText = priceDetails.map(detail => `₹${detail.price}`).join(', ');
    const tooltipText = priceDetails.map(detail => {
      const base = `₹${detail.price} (${detail.quantity}${detail.unit}, ${detail.gst}%)`;
      return detail.cakeType ? `${base} (${detail.cakeType === 'freshCream' ? 'FC' : 'BC'})` : base;
    }).join(', ');
    return (
      <Tooltip title={tooltipText}>
        {displayText}
      </Tooltip>
    );
  };

  // CSV Data for Export
  const csvData = filteredProducts.map(product => ({
    ID: product.productId,
    Name: product.name,
    Category: product.category?.name || '',
    Album: product.album?.name || '',
    Price: product.priceDetails.map(d => d.price).join(', '),
    'Offer %': product.priceDetails.map(d => d.offerPercent).join(', '),
    Quantity: product.priceDetails.map(d => d.quantity).join(', '),
    Unit: product.priceDetails.map(d => d.unit).join(', '),
    GST: product.priceDetails.map(d => d.gst).join(', '),
    'Cake Type': product.priceDetails.map(d => d.cakeType || '').join(', '),
    Stock: product.inStock,
    Veg: product.isVeg ? 'Yes' : 'No',
    Pastry: product.isPastry ? 'Yes' : 'No', // ✅ Added Pastry to CSV
    Type: product.productType,
  }));

  // Table Columns
  const columns = [
    {
      title: 'ID',
      dataIndex: 'productId',
      key: 'productId',
      width: 80,
      sorter: (a, b) => a.productId.localeCompare(b.productId),
    },
    {
      title: 'Veg',
      dataIndex: 'isVeg',
      key: 'isVeg',
      width: 60,
      render: (isVeg) => (
        <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: isVeg ? 'green' : 'red' }} />
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Category',
      dataIndex: ['category', 'name'],
      key: 'category',
    },
    {
      title: 'Album',
      dataIndex: ['album', 'name'],
      key: 'album',
    },
    {
      title: 'Price',
      dataIndex: 'priceDetails',
      key: 'priceDetails',
      render: (priceDetails) => formatPriceDetails(priceDetails),
      sorter: (a, b) => a.priceDetails[0]?.price - b.priceDetails[0]?.price,
    },
    {
      title: 'Stock',
      dataIndex: 'inStock',
      key: 'inStock',
      render: (stock) => (
        <Tag color={stock > 5 ? 'green' : stock > 0 ? 'yellow' : 'red'}>
          {stock > 0 ? `In Stock (${stock})` : 'Out of Stock'}
        </Tag>
      ),
      sorter: (a, b) => a.inStock - b.inStock,
    },
    {
      title: 'Images',
      dataIndex: 'images',
      key: 'images',
      render: (images) =>
        images?.length > 0 ? (
          <Button icon={<EyeOutlined />} onClick={() => handleImagePreview(images)} />
        ) : (
          <Button icon={<EyeInvisibleOutlined />} disabled />
        ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => router.push(`/products/edit/${record._id}`)} />
          <Popconfirm
            title="Are you sure you want to delete this product?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Handle Page Size Change
  const handlePageSizeChange = (current, size) => {
    setPageSize(size);
  };

  return (
    <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2>Product List ({filteredProducts.length} of {products.length})</h2>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push('/products/add')}>
            Create Product
          </Button>
          <CSVLink
            data={csvData}
            filename={`products_${new Date().toISOString().slice(0, 10)}.csv`}
            target="_blank"
          >
            <Button icon={<DownloadOutlined />}>Export CSV</Button>
          </CSVLink>
        </Space>
      </div>

      {/* Filters */}
      <Space wrap style={{ marginBottom: '10px' }}>
        <Input
          placeholder="Search by Name, ID, or Category"
          value={searchText}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ width: '300px' }}
          prefix={<SearchOutlined />}
        />
        <Select
          placeholder="Category"
          onChange={(value) => handleFilterChange('category', value)}
          allowClear
          style={{ width: '200px' }}
          value={selectedCategory}
        >
          {categories.map((c) => (
            <Option key={c._id} value={c._id}>{c.name}</Option>
          ))}
        </Select>
        <Select
          placeholder="Pastry" // ✅ Added Pastry filter
          onChange={(value) => handleFilterChange('pastry', value)}
          allowClear
          style={{ width: '150px' }}
          value={selectedPastry}
        >
          <Option value="pastry">Pastry</Option>
          <Option value="non-pastry">Non-Pastry</Option>
        </Select>
        <Select
          placeholder="Stock"
          onChange={(value) => handleFilterChange('stock', value)}
          allowClear
          style={{ width: '150px' }}
          value={selectedStock}
        >
          <Option value="inStock">In Stock</Option>
          <Option value="outStock">Out of Stock</Option>
        </Select>
        <Select
          placeholder="Veg/Non-Veg"
          onChange={(value) => handleFilterChange('veg', value)}
          allowClear
          style={{ width: '150px' }}
          value={selectedVeg}
        >
          <Option value="veg">Veg</Option>
          <Option value="non-veg">Non-Veg</Option>
        </Select>
        <Select
          placeholder="Type"
          onChange={(value) => handleFilterChange('type', value)}
          allowClear
          style={{ width: '150px' }}
          value={selectedType}
        >
          <Option value="cake">Cake</Option>
          <Option value="non-cake">Non-Cake</Option>
        </Select>
        <Button onClick={clearFilters}>Clear Filters</Button>
      </Space>

      <Table
        columns={columns}
        dataSource={filteredProducts}
        rowKey="_id"
        loading={loading}
        pagination={{
          pageSize,
          pageSizeOptions: [10, 20, 50],
          showSizeChanger: true,
          onShowSizeChange: handlePageSizeChange,
        }}
        scroll={{ x: 'max-content' }}
      />

      <Modal
        visible={previewVisible}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width={600}
      >
        <Space wrap>
          {previewImages.map((img, idx) => (
            <Image key={idx} src={img} alt={`Preview ${idx}`} width={150} />
          ))}
        </Space>
      </Modal>
    </div>
  );
};

export default ProductList;