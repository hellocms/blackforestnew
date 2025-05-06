import React, { useState, useEffect } from 'react';
import { Card, Typography, Row, Col, Button, Dropdown, Menu, Layout, Space, Select } from 'antd';
import { StockOutlined, FileTextOutlined, FileDoneOutlined, DollarOutlined, DownOutlined, BankOutlined, UserOutlined, ShoppingOutlined, TagsOutlined, ShopOutlined, LogoutOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';
import { jwtDecode as jwtDecodeLib } from "jwt-decode";

const { Title } = Typography;
const { Header } = Layout;
const { Option } = Select;

const CategoryDashboard = () => {
  const [branchId, setBranchId] = useState(null);
  const [branchName, setBranchName] = useState("");
  const [userName, setUserName] = useState("User");
  const [todayAssignment, setTodayAssignment] = useState({});
  const [cashiers, setCashiers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [selectedCashier, setSelectedCashier] = useState(null);
  const [selectedManager, setSelectedManager] = useState(null);
  const router = useRouter();

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://apib.dinasuvadu.in';

  const fetchBranchDetails = async (token, branchId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/branch/${branchId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setBranchName(data.name || `Branch ${branchId.replace('B', '')}`);
      }
    } catch (error) {
      console.error('Error fetching branch details:', error);
    }
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
      }
    } catch (error) {
      console.error(`Error fetching ${team}s:`, error);
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
      }
    } catch (error) {
      console.error('Error fetching today\'s assignment:', error);
    }
  };

  const saveAssignment = async () => {
    if (!selectedCashier && !selectedManager) {
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
        setTodayAssignment(data.assignment);
      }
    } catch (error) {
      console.error('Error saving assignment:', error);
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    router.replace('/login');
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const decoded = jwtDecodeLib(token);
      setUserName(decoded.name || decoded.username || "User");
      if (decoded.branchId) {
        setBranchId(decoded.branchId);
        fetchBranchDetails(token, decoded.branchId);
        fetchEmployees(token, 'Cashier', setCashiers);
        fetchEmployees(token, 'Manager', setManagers);
        fetchTodayAssignment(token);
      }
    } catch (error) {
      console.error('Error decoding token:', error);
      router.push('/login');
    }
  }, [router]);

  const handleBillingClick = () => {
    if (branchId) {
      router.push(`/branch/${branchId}`);
    } else {
      alert('Branch ID not available.');
    }
  };

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
      <Button type="primary" onClick={saveAssignment} block>
        Confirm Assignment
      </Button>
    </div>
  );

  const stockMenu = (
    <Menu>
      <Menu.Item key="create"><a href="/dealers/stock-entry/create">Create</a></Menu.Item>
      <Menu.Item key="list"><a href="/dealers/stock-entry/list">List</a></Menu.Item>
    </Menu>
  );

  const billMenu = (
    <Menu>
      <Menu.Item key="create"><a href="/dealers/bill-entry/create">Create</a></Menu.Item>
      <Menu.Item key="list"><a href="/dealers/bill-entry/list">List</a></Menu.Item>
    </Menu>
  );

  const closingMenu = (
    <Menu>
      <Menu.Item key="create"><a href="/dealers/closing-entry/closingentry">Create</a></Menu.Item>
      <Menu.Item key="list"><a href="/dealers/closing-entry/list">List</a></Menu.Item>
    </Menu>
  );

  const dealersMenu = (
    <Menu>
      <Menu.Item key="create"><a href="/dealers/create">Create</a></Menu.Item>
      <Menu.Item key="list"><a href="/dealers/list">List</a></Menu.Item>
    </Menu>
  );

  const productsMenu = (
    <Menu>
      <Menu.Item key="create"><a href="/dealers/product/create">Create</a></Menu.Item>
      <Menu.Item key="list"><a href="/dealers/product/list">List</a></Menu.Item>
    </Menu>
  );

  const categoryMenu = (
    <Menu>
      <Menu.Item key="create"><a href="/dealers/category/create">Create</a></Menu.Item>
      <Menu.Item key="list"><a href="/dealers/category/list">List</a></Menu.Item>
    </Menu>
  );

  
return (
  <Layout style={{ minHeight: '100vh' }}>
    {/* Header remains unchanged */}
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
      {/* Header content remains unchanged */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <Space align="center">
          <Dropdown overlay={userMenu} trigger={['click']}>
            <Button
              type="text"
              icon={<UserOutlined />}
              style={{ fontSize: "16px", color: "#FFFFFF" }}
            />
          </Dropdown>
          <span style={{ fontSize: "14px", color: "#FFFFFF" }}>
            {userName} | {branchName}
          </span>
        </Space>
      </div>
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}></div>
      <div style={{ display: "flex", alignItems: "center" }}>
        <Button
          type="text"
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          style={{ fontSize: "16px", color: "#FFFFFF" }}
        >
          Logout
        </Button>
      </div>
    </Header>

    <div
      style={{
        padding: '40px 20px',
        background: 'linear-gradient(to-bottom, #f0f2f5, #e6e9f0)',
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        marginTop: '64px',
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

        <Row gutter={[24, 24]} justify="center">
          {/* Billing Card - Always shown */}
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

          {/* Stock Entry Card - Always shown */}
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

          {/* Bill Entry Card - Always shown */}
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

          {/* Closing Entry Card - Always shown */}
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

          {/* Expense Entry Card - Always shown */}
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
                href="/dealers/expense/ExpenseEntry"
                style={{ width: '150px' }}
              >
                Expense Entry
              </Button>
            </Card>
          </Col>

          {/* Show following cards only when userName is "Factory" */}
          {userName === "Factory" && (
            <>
              {/* Financial Management Card */}
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
                    href="/FinancialManagement"
                    style={{ width: '150px' }}
                  >
                    Finance
                  </Button>
                </Card>
              </Col>

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
            </>
          )}
        </Row>
      </div>
    </div>
  </Layout>
);
};

CategoryDashboard.useLayout = false;
export default CategoryDashboard;