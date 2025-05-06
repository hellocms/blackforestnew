import React, { useState, useEffect } from 'react';
import { Card, Space, Typography, Row, Col, Button, Dropdown, Menu } from 'antd';
import { StockOutlined, FileTextOutlined, FileDoneOutlined, DollarOutlined, DownOutlined, BankOutlined, UserOutlined, ShoppingOutlined, TagsOutlined, ShopOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';

const { Title } = Typography;

const CategoryDashboard = () => {
  const [branchId, setBranchId] = useState(null); // State to store branchId
  const router = useRouter();

  // Fetch branchId from token on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Decode token to get branchId (assuming JWT contains it)
        const decoded = JSON.parse(atob(token.split('.')[1])); // Basic JWT decoding
        if (decoded.branchId) {
          setBranchId(decoded.branchId);
        }
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, []);

  // Handler for Billing button click
  const handleBillingClick = () => {
    if (branchId) {
      router.push(`/branch/${branchId}`);
    } else {
      // Fallback or error handling if no branchId
      alert('Branch ID not available. Please ensure you’re logged in with a branch role.');
    }
  };

  // Dropdown menus (unchanged)
  const stockMenu = (
    <Menu>
      <Menu.Item key="create">
        <a href="http://localhost:3000/dealers/stock-entry/create">Create</a>
      </Menu.Item>
      <Menu.Item key="list">
        <a href="http://localhost:3000/dealers/stock-entry/list">List</a>
      </Menu.Item>
    </Menu>
  );

  const billMenu = (
    <Menu>
      <Menu.Item key="create">
        <a href="http://localhost:3000/dealers/bill-entry/create">Create</a>
      </Menu.Item>
      <Menu.Item key="list">
        <a href="http://localhost:3000/dealers/bill-entry/list">List</a>
      </Menu.Item>
    </Menu>
  );

  const closingMenu = (
    <Menu>
      <Menu.Item key="create">
        <a href="http://localhost:3000/dealers/closing-entry/closingentry">Create</a>
      </Menu.Item>
      <Menu.Item key="list">
        <a href="http://localhost:3000/dealers/closing-entry/list">List</a>
      </Menu.Item>
    </Menu>
  );

  const dealersMenu = (
    <Menu>
      <Menu.Item key="create">
        <a href="http://localhost:3000/dealers/create">Create</a>
      </Menu.Item>
      <Menu.Item key="list">
        <a href="http://localhost:3000/dealers/list">List</a>
      </Menu.Item>
    </Menu>
  );

  const productsMenu = (
    <Menu>
      <Menu.Item key="create">
        <a href="http://localhost:3000/dealers/product/create">Create</a>
      </Menu.Item>
      <Menu.Item key="list">
        <a href="http://localhost:3000/dealers/product/list">List</a>
      </Menu.Item>
    </Menu>
  );

  const categoryMenu = (
    <Menu>
      <Menu.Item key="create">
        <a href="http://localhost:3000/dealers/category/create">Create</a>
      </Menu.Item>
      <Menu.Item key="list">
        <a href="http://localhost:3000/dealers/category/list">List</a>
      </Menu.Item>
    </Menu>
  );

  return (
    <div
      style={{
        padding: '40px 20px',
        background: 'linear-gradient(to bottom, #f0f2f5, #e6e9f0)',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
      }}
    >
      <div style={{ maxWidth: '1200px', width: '100%' }}>
        <Title
          level={2}
          style={{
            marginBottom: '40px',
            color: '#1a3042',
            fontWeight: 'bold',
            textAlign: 'center',
          }}
        >
          Entry Dashboard
        </Title>

        {/* Grid of Category Cards - First Row */}
        <Row gutter={[24, 24]} justify="center">
          {/* Billing Card (New) */}
          <Col xs={24} sm={12} md={6}>
            <Card
              title="Billing"
              headStyle={{ background: '#e6e9f0', fontWeight: 'bold', color: '#1a3042' }}
              style={{
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                textAlign: 'center',
                height: '200px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              bodyStyle={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Button
                type="default"
                size="large"
                icon={<ShopOutlined />}
                onClick={handleBillingClick}
                style={{ width: '150px' }}
              >
                Billing
              </Button>
            </Card>
          </Col>

          {/* StockEntry Card */}
          <Col xs={24} sm={12} md={6}>
            <Card
              title="Stock Entry"
              headStyle={{ background: '#e6e9f0', fontWeight: 'bold', color: '#1a3042' }}
              style={{
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                textAlign: 'center',
                height: '200px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              bodyStyle={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Dropdown overlay={stockMenu} trigger={['click']}>
                <Button
                  type="default"
                  size="large"
                  icon={<StockOutlined />}
                  style={{ width: '150px' }}
                >
                  Actions <DownOutlined />
                </Button>
              </Dropdown>
            </Card>
          </Col>

          {/* BillEntry Card */}
          <Col xs={24} sm={12} md={6}>
            <Card
              title="Bill Entry"
              headStyle={{ background: '#e6e9f0', fontWeight: 'bold', color: '#1a3042' }}
              style={{
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                textAlign: 'center',
                height: '200px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              bodyStyle={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Dropdown overlay={billMenu} trigger={['click']}>
                <Button
                  type="default"
                  size="large"
                  icon={<FileTextOutlined />}
                  style={{ width: '150px' }}
                >
                  Actions <DownOutlined />
                </Button>
              </Dropdown>
            </Card>
          </Col>

          {/* ClosingEntry Card */}
          <Col xs={24} sm={12} md={6}>
            <Card
              title="Closing Entry"
              headStyle={{ background: '#e6e9f0', fontWeight: 'bold', color: '#1a3042' }}
              style={{
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                textAlign: 'center',
                height: '200px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              bodyStyle={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Dropdown overlay={closingMenu} trigger={['click']}>
                <Button
                  type="default"
                  size="large"
                  icon={<FileDoneOutlined />}
                  style={{ width: '150px' }}
                >
                  Actions <DownOutlined />
                </Button>
              </Dropdown>
            </Card>
          </Col>

          {/* ExpenseEntry Card */}
          <Col xs={24} sm={12} md={6}>
            <Card
              title="Expense Entry"
              headStyle={{ background: '#e6e9f0', fontWeight: 'bold', color: '#1a3042' }}
              style={{
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                textAlign: 'center',
                height: '200px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              bodyStyle={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Button
                type="default"
                size="large"
                icon={<DollarOutlined />}
                href="http://localhost:3000/dealers/expense/ExpenseEntry"
                style={{ width: '150px' }}
              >
                Expense Entry
              </Button>
            </Card>
          </Col>
        </Row>

        {/* Second Row for Financial Management */}
        <Row gutter={[24, 24]} justify="center" style={{ marginTop: '24px' }}>
          <Col xs={24} sm={12} md={6}>
            <Card
              title="Financial Management"
              headStyle={{ background: '#e6e9f0', fontWeight: 'bold', color: '#1a3042' }}
              style={{
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                textAlign: 'center',
                height: '200px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              bodyStyle={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Button
                type="default"
                size="large"
                icon={<BankOutlined />}
                href="http://localhost:3000/FinancialManagement"
                style={{ width: '150px' }}
              >
                Finance
              </Button>
            </Card>
          </Col>
        </Row>

        {/* Third Row for Creation Section */}
        <Title
          level={3}
          style={{
            marginTop: '40px',
            marginBottom: '24px',
            color: '#1a3042',
            fontWeight: 'bold',
            textAlign: 'center',
          }}
        >
          Creation
        </Title>
        <Row gutter={[24, 24]} justify="center">
          {/* Dealers Card */}
          <Col xs={24} sm={12} md={6}>
            <Card
              title="Dealers"
              headStyle={{ background: '#e6e9f0', fontWeight: 'bold', color: '#1a3042' }}
              style={{
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                textAlign: 'center',
                height: '200px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              bodyStyle={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Dropdown overlay={dealersMenu} trigger={['click']}>
                <Button
                  type="default"
                  size="large"
                  icon={<UserOutlined />}
                  style={{ width: '150px' }}
                >
                  Actions <DownOutlined />
                </Button>
              </Dropdown>
            </Card>
          </Col>

          {/* Products Card */}
          <Col xs={24} sm={12} md={6}>
            <Card
              title="Products"
              headStyle={{ background: '#e6e9f0', fontWeight: 'bold', color: '#1a3042' }}
              style={{
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                textAlign: 'center',
                height: '200px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              bodyStyle={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Dropdown overlay={productsMenu} trigger={['click']}>
                <Button
                  type="default"
                  size="large"
                  icon={<ShoppingOutlined />}
                  style={{ width: '150px' }}
                >
                  Actions <DownOutlined />
                </Button>
              </Dropdown>
            </Card>
          </Col>

          {/* Category Card */}
          <Col xs={24} sm={12} md={6}>
            <Card
              title="Category"
              headStyle={{ background: '#e6e9f0', fontWeight: 'bold', color: '#1a3042' }}
              style={{
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                textAlign: 'center',
                height: '200px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              bodyStyle={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Dropdown overlay={categoryMenu} trigger={['click']}>
                <Button
                  type="default"
                  size="large"
                  icon={<TagsOutlined />}
                  style={{ width: '150px' }}
                >
                  Actions <DownOutlined />
                </Button>
              </Dropdown>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

CategoryDashboard.useLayout = false;
export default CategoryDashboard;