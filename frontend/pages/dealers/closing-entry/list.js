import React, { useState, useEffect } from 'react';
import { Table, Select, DatePicker, Button, Spin, Typography, Space, Card, Modal, Tooltip } from 'antd';
import { RedoOutlined, PrinterOutlined, PlusOutlined, StockOutlined, FileTextOutlined, DollarOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);

const { Option } = Select;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const ClosingEntryList = () => {
  const [closingEntries, setClosingEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [branchFilter, setBranchFilter] = useState(null);
  const [dateRangeFilter, setDateRangeFilter] = useState(null);
  const [dateFilterType, setDateFilterType] = useState('Created');
  const [isExpenseModalVisible, setIsExpenseModalVisible] = useState(false);
  const [expenseDetails, setExpenseDetails] = useState([]);
  const [selectedEntryId, setSelectedEntryId] = useState(null);
  // New state for modal title
  const [modalTitle, setModalTitle] = useState('Expense Details');

  useEffect(() => {
    fetchBranches();
    fetchClosingEntries();
  }, []);

  useEffect(() => {
    let filtered = [...closingEntries];
    if (branchFilter) {
      filtered = filtered.filter((entry) => entry.branchId?._id === branchFilter);
    }
    if (dateRangeFilter && dateRangeFilter.length === 2) {
      const startDate = dayjs(dateRangeFilter[0]).startOf('day');
      const endDate = dayjs(dateRangeFilter[1]).endOf('day');
      filtered = filtered.filter((entry) => {
        const entryDate = dateFilterType === 'Created' ? dayjs(entry.createdAt) : dayjs(entry.date);
        return entryDate.isValid() && entryDate.isBetween(startDate, endDate, null, '[]');
      });
    }
    setFilteredEntries(filtered);
  }, [closingEntries, branchFilter, dateRangeFilter, dateFilterType]);

  const fetchBranches = async () => {
    try {
      const response = await fetch('https://apib.dinasuvadu.in/api/branches/public', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await response.json();
      if (response.ok) {
        setBranches(result);
      }
    } catch (err) {
      console.error('Error fetching branches:', err);
    }
  };

  const fetchClosingEntries = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://apib.dinasuvadu.in/api/closing-entries', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await response.json();
      if (response.ok) {
        setClosingEntries(result);
        setFilteredEntries(result);
      }
    } catch (err) {
      console.error('Error fetching closing entries:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewExpenses = (entry) => {
    setSelectedEntryId(entry._id);
    const expenses = entry.expenseDetails || []; // Adjust field name if different
    setExpenseDetails(expenses);
    // Set modal title with branch name and date
    const branchName = entry.branchId?.name || 'Unknown Branch';
    const formattedDate = dayjs(entry.date).format('YYYY-MM-DD');
    setModalTitle(`Expense Details for ${branchName} on ${formattedDate}`);
    setIsExpenseModalVisible(true);
  };

  const handleModalClose = () => {
    setIsExpenseModalVisible(false);
    setExpenseDetails([]);
    setSelectedEntryId(null);
    setModalTitle('Expense Details'); // Reset title
  };

  const handleReset = () => {
    setBranchFilter(null);
    setDateRangeFilter(null);
    setDateFilterType('Created');
  };

  const handlePrint = () => {
    const printContent = `
      <html>
        <head>
          <title>Closing Entry List</title>
          <style>
            @media print {
              @page { size: A4; margin: 20mm; }
              body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
              table { width: 100%; border-collapse: collapse; font-size: 12px; }
              th, td { border: 1px solid #000; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; font-weight: bold; }
              .difference { color: #ff4d4f; }
              .ok { color: #52c41a; }
            }
          </style>
        </head>
        <body>
          <h1>Closing Entry List</h1>
          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Branch</th>
                <th>Date</th>
                <th>Total Sales</th>
                <th>Total Payments</th>
                <th>Difference</th>
                <th>Credit Card</th>
                <th>UPI</th>
                <th>Cash</th>
                <th>Expenses</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              ${filteredEntries
                .map(
                  (entry, index) => {
                    const sales = entry.systemSales + entry.manualSales + entry.onlineSales;
                    const payments = entry.creditCardPayment + entry.upiPayment + entry.cashPayment + entry.expenses;
                    const diff = payments - sales;
                    return `
                      <tr>
                        <td>${index + 1}</td>
                        <td>${entry.branchId?.name || 'N/A'}</td>
                        <td>${dayjs(entry.date).format('YYYY-MM-DD')}</td>
                        <td>₹${sales}</td>
                        <td>₹${payments}</td>
                        <td class="${diff === 0 ? 'ok' : 'difference'}">
                          ₹${diff}
                        </td>
                        <td>₹${entry.creditCardPayment}</td>
                        <td>₹${entry.upiPayment}</td>
                        <td>₹${entry.cashPayment}</td>
                        <td>₹${entry.expenses}</td>
                        <td>${dayjs(entry.createdAt).format('YYYY-MM-DD hh:mm A')}</td>
                      </tr>
                    `;
                  }
                )
                .join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const expenseColumns = [
    {
      title: 'S.No',
      key: 'sno',
      render: (text, record, index) => index + 1,
      width: 80,
    },
    {
      title: 'Purpose',
      dataIndex: 'purpose',
      key: 'purpose',
      render: (value) => value || 'N/A',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (value) => `₹${value || 0}`,
      align: 'right',
    },
  ];

  const columns = [
    {
      title: 'S.No',
      key: 'sno',
      render: (text, record, index) => index + 1,
      width: 60,
    },
    {
      title: 'Branch',
      dataIndex: ['branchId', 'name'],
      key: 'branch',
      render: (value) => value || 'N/A',
      width: 120,
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
      render: (date) => dayjs(date).format('YYYY-MM-DD'),
      width: 100,
    },
    {
      title: 'Total Sales',
      key: 'totalSales',
      sorter: (a, b) => (a.systemSales + a.manualSales + a.onlineSales) - (b.systemSales + b.manualSales + b.onlineSales),
      render: (record) => `₹${record.systemSales + record.manualSales + record.onlineSales}`,
      width: 120,
    },
    {
      title: 'Total Payments',
      key: 'totalPayments',
      sorter: (a, b) => (a.creditCardPayment + a.upiPayment + a.cashPayment + a.expenses) - (b.creditCardPayment + b.upiPayment + b.cashPayment + b.expenses),
      render: (record) => `₹${record.creditCardPayment + record.upiPayment + record.cashPayment + record.expenses}`,
      width: 120,
    },
    {
      title: 'Difference',
      key: 'difference',
      render: (record) => {
        const sales = record.systemSales + record.manualSales + record.onlineSales;
        const payments = record.creditCardPayment + record.upiPayment + record.cashPayment + record.expenses;
        const diff = payments - sales;
        return (
          <Text style={{ color: diff === 0 ? '#52c41a' : '#ff4d4f' }}>
            ₹{diff}
          </Text>
        );
      },
      width: 120,
    },
    {
      title: 'Credit Card',
      dataIndex: 'creditCardPayment',
      key: 'creditCardPayment',
      render: (value) => `₹${value}`,
      width: 120,
    },
    {
      title: 'UPI',
      dataIndex: 'upiPayment',
      key: 'upiPayment',
      render: (value) => `₹${value}`,
      width: 120,
    },
    {
      title: 'Cash',
      dataIndex: 'cashPayment',
      key: 'cashPayment',
      render: (value) => `₹${value}`,
      width: 120,
    },
    {
      title: 'Expenses',
      dataIndex: 'expenses',
      key: 'expenses',
      render: (value, record) => (
        <Space>
          <span>₹{value}</span>
          {value > 0 && (
            <Tooltip title="View Expense Details">
              <Button
                type="link"
                icon={<EyeOutlined />}
                onClick={() => handleViewExpenses(record)}
                style={{ padding: 0 }}
              />
            </Tooltip>
          )}
        </Space>
      ),
      width: 140,
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
      render: (date) => dayjs(date).format('YYYY-MM-DD hh:mm A'),
      width: 160,
    },
  ];

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
      <div style={{ maxWidth: '1600px', width: '100%' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <Space>
            <Button
              type="default"
              size="large"
              icon={<StockOutlined />}
              href="http://localhost:3000/dealers/stock-entry/create"
            />
            <Button
              type="default"
              size="large"
              href="http://localhost:3000/dealers/stock-entry/list"
            >
              Stock List
            </Button>
            <Button
              type="default"
              size="large"
              icon={<FileTextOutlined />}
              href="http://localhost:3000/dealers/bill-entry/create"
            />
            <Button
              type="default"
              size="large"
              href="http://localhost:3000/dealers/bill-entry/list"
            >
              Bill Entry List
            </Button>
            <Button
              type="default"
              size="large"
              icon={<DollarOutlined />}
              href="http://localhost:3000/dealers/expense/ExpenseEntry"
            >
              Expense Entry
            </Button>
          </Space>

          <Title
            level={2}
            style={{
              margin: 0,
              color: '#1a3042',
              fontWeight: 'bold',
              flexGrow: 1,
              textAlign: 'center',
            }}
          >
            Closing Entry List
          </Title>

          <div style={{ width: '300px' }}></div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
          </div>
        ) : (
          <>
            <Card
              style={{
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                background: '#fff',
                marginBottom: '20px',
              }}
            >
              <Space wrap style={{ width: '100%', padding: '10px', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Text strong>Branch</Text>
                  <Select
                    placeholder="All Branches"
                    value={branchFilter}
                    onChange={(value) => setBranchFilter(value)}
                    allowClear
                    style={{ width: '200px' }}
                  >
                    {branches.map((branch) => (
                      <Option key={branch._id} value={branch._id}>
                        {branch.name}
                      </Option>
                    ))}
                  </Select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Text strong>Date Filter</Text>
                  <Space>
                    <Select
                      value={dateFilterType}
                      onChange={(value) => setDateFilterType(value)}
                      style={{ width: '120px' }}
                    >
                      <Option value="Created">Created</Option>
                      <Option value="Date">Date</Option>
                    </Select>
                    <RangePicker
                      value={dateRangeFilter}
                      onChange={(dates) => setDateRangeFilter(dates)}
                      format="YYYY-MM-DD"
                      style={{ width: '250px' }}
                    />
                  </Space>
                </div>

                <Space style={{ marginTop: '20px' }}>
                  <Button
                    icon={<PrinterOutlined />}
                    onClick={handlePrint}
                  />
                  <Button
                    type="default"
                    icon={<RedoOutlined />}
                    onClick={handleReset}
                  >
                    Reset
                  </Button>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    href="http://localhost:3000/dealers/closing-entry/closingentry"
                  >
                    Create Closing Bill
                  </Button>
                </Space>
              </Space>
            </Card>

            <Card
              style={{
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                background: '#fff',
              }}
            >
              <Table
                columns={columns}
                dataSource={filteredEntries}
                rowKey="_id"
                pagination={{ pageSize: 10 }}
                bordered
              />
            </Card>

            <Modal
              title={modalTitle} // Updated to use dynamic title
              open={isExpenseModalVisible}
              onCancel={handleModalClose}
              footer={null}
              width={600}
            >
              {expenseDetails.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Text>No expense details available.</Text>
                </div>
              ) : (
                <Table
                  columns={expenseColumns}
                  dataSource={expenseDetails}
                  rowKey={(record, index) => index}
                  pagination={false}
                  bordered
                  summary={() => (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={2} align="right">
                        <Text strong>Total Amount</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} align="right">
                        <Text strong>
                          ₹{expenseDetails.reduce((sum, item) => sum + (item.amount || 0), 0)}
                        </Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                />
              )}
            </Modal>
          </>
        )}
      </div>
    </div>
  );
};

ClosingEntryList.useLayout = false;
export default ClosingEntryList;