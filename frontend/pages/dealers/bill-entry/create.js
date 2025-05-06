import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message, Row, Col, Select, Upload, DatePicker } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';
import moment from 'moment';

const { Option } = Select;
const { Dragger } = Upload;

const CreateBillEntry = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [dealers, setDealers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [errors, setErrors] = useState({ dealer: '', branch: '', billNumber: '', billDate: '', amount: '', billImage: '' });
  const router = useRouter();

  // Fetch dealers
  useEffect(() => {
    const fetchDealers = async () => {
      try {
        const response = await fetch('https://apib.dinasuvadu.in/api/dealers', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        const result = await response.json();
        if (response.ok) {
          setDealers(result);
        } else {
          message.error(result.message || 'Failed to fetch dealers');
        }
      } catch (err) {
        message.error('Server error while fetching dealers');
        console.error('Error:', err);
      }
    };
    fetchDealers();
  }, []);

  // Fetch branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await fetch('https://apib.dinasuvadu.in/api/branches/public', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        const result = await response.json();
        if (response.ok) {
          setBranches(result);
        } else {
          message.error(`Failed to fetch branches: ${result.message || 'Server error'}`);
        }
      } catch (err) {
        message.error('Server error while fetching branches');
        console.error('Error:', err);
      }
    };
    fetchBranches();
  }, []);

  const onFinish = async (values) => {
    setLoading(true);
    setErrors({ dealer: '', branch: '', billNumber: '', billDate: '', amount: '', billImage: '' });

    console.log('Form Values:', values);

    const formData = new FormData();
    formData.append('dealer', values.dealer || '');
    formData.append('branch', values.branch || '');
    formData.append('billNumber', values.billNumber || '');
    formData.append('billDate', values.billDate ? values.billDate.format('YYYY-MM-DD') : '');
    formData.append('amount', values.amount || '0');

    if (values.billImage && Array.isArray(values.billImage) && values.billImage.length > 0) {
      const file = values.billImage[0].originFileObj;
      if (file instanceof File) {
        formData.append('billImage', file);
        console.log('Appended File:', file);
      } else {
        console.error('Invalid file object:', values.billImage[0]);
        setErrors((prev) => ({ ...prev, billImage: 'Invalid file format' }));
        setLoading(false);
        return;
      }
    } else {
      console.error('No file selected or invalid file list:', values.billImage);
      setErrors((prev) => ({ ...prev, billImage: 'No file selected or invalid file' }));
      setLoading(false);
      return;
    }

    for (let pair of formData.entries()) {
      console.log('FormData Entry:', pair[0], pair[1]);
    }

    try {
      const response = await fetch('https://apib.dinasuvadu.in/api/dealers/bills', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      console.log('Backend Response:', result);
      if (response.ok) {
        message.success(result.message || 'Bill entry created successfully');
        form.resetFields();
        router.push('/dealers/bill-entry/list');
      } else {
        if (result.message.includes('required')) {
          if (result.message.includes('dealer')) setErrors((prev) => ({ ...prev, dealer: 'Dealer is required' }));
          if (result.message.includes('branch')) setErrors((prev) => ({ ...prev, branch: 'Branch is required' }));
          if (result.message.includes('bill number')) setErrors((prev) => ({ ...prev, billNumber: 'Bill number is required' }));
          if (result.message.includes('bill date')) setErrors((prev) => ({ ...prev, billDate: 'Bill date is required' }));
          if (result.message.includes('amount')) setErrors((prev) => ({ ...prev, amount: 'Amount is required' }));
          if (result.message.includes('bill image')) setErrors((prev) => ({ ...prev, billImage: 'Bill image is required' }));
        } else if (result.message.includes('positive')) {
          setErrors((prev) => ({ ...prev, amount: 'Amount must be a positive number' }));
        } else if (result.message.includes('unique')) {
          setErrors((prev) => ({ ...prev, billNumber: 'Bill number must be unique' }));
        } else if (result.message.includes('allowed')) {
          setErrors((prev) => ({ ...prev, billImage: 'Only images (jpeg, jpg, png) and PDF files are allowed!' }));
        } else if (result.message.includes('bill date')) {
          setErrors((prev) => ({ ...prev, billDate: result.message }));
        } else {
          message.error(result.message || 'An error occurred');
        }
      }
    } catch (err) {
      message.error('Server error while creating bill entry');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Form Validation Errors:', errorInfo);
    const newErrors = { dealer: '', branch: '', billNumber: '', billDate: '', amount: '', billImage: '' };
    errorInfo.errorFields.forEach((field) => {
      if (field.name[0] === 'dealer') newErrors.dealer = field.errors[0];
      if (field.name[0] === 'branch') newErrors.branch = field.errors[0];
      if (field.name[0] === 'billNumber') newErrors.billNumber = field.errors[0];
      if (field.name[0] === 'billDate') newErrors.billDate = field.errors[0];
      if (field.name[0] === 'amount') newErrors.amount = field.errors[0];
      if (field.name[0] === 'billImage') newErrors.billImage = field.errors[0];
    });
    setErrors(newErrors);
    message.error('Please fill in all required fields correctly');
  };

  const uploadProps = {
    name: 'billImage',
    multiple: false,
    beforeUpload: (file) => {
      return false;
    },
    onChange(info) {
      if (info.file.status === 'error') {
        setErrors((prev) => ({ ...prev, billImage: 'Upload failed' }));
      }
      console.log('Upload onChange:', info.fileList);
    },
  };

  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh', padding: '20px' }}>
      <Row justify="center" align="middle" style={{ minHeight: '100vh' }}>
        <Col xs={24} sm={20} md={16} lg={12}>
          <h1 style={{ color: '#000000', textAlign: 'center', marginBottom: '20px' }}>
            Create Bill Entry
          </h1>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            style={{ background: '#ffffff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
          >
            <Form.Item
              validateStatus={errors.dealer ? 'error' : ''}
              help={errors.dealer || ''}
              label={<span style={{ color: '#000000' }}>Dealer Name</span>}
              name="dealer"
              rules={[{ required: true, message: 'Please select a dealer' }]}
            >
              <Select
                placeholder="Select a dealer"
                style={{ width: '100%', color: '#000000', background: '#ffffff', borderColor: '#d3d3d3' }}
              >
                {dealers.map((dealer) => (
                  <Option key={dealer._id} value={dealer._id}>
                    {dealer.dealer_name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              validateStatus={errors.branch ? 'error' : ''}
              help={errors.branch || ''}
              label={<span style={{ color: '#000000' }}>Branch Name</span>}
              name="branch"
              rules={[{ required: true, message: 'Please select a branch' }]}
            >
              <Select
                placeholder="Select a branch"
                style={{ width: '100%', color: '#000000', background: '#ffffff', borderColor: '#d3d3d3' }}
              >
                {branches.map((branch) => (
                  <Option key={branch._id} value={branch._id}>
                    {branch.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              validateStatus={errors.billNumber ? 'error' : ''}
              help={errors.billNumber || ''}
              label={<span style={{ color: '#000000' }}>Bill Number</span>}
              name="billNumber"
              rules={[{ required: true, message: 'Please enter the bill number' }]}
            >
              <Input
                placeholder="Enter bill number"
                style={{ color: '#000000', background: '#ffffff', borderColor: '#d3d3d3' }}
              />
            </Form.Item>

            <Form.Item
              validateStatus={errors.billDate ? 'error' : ''}
              help={errors.billDate || ''}
              label={<span style={{ color: '#000000' }}>Bill Date</span>}
              name="billDate"
              rules={[{ required: true, message: 'Please select the bill date' }]}
            >
              <DatePicker
                placeholder="Select bill date"
                style={{ width: '100%', color: '#000000', background: '#ffffff', borderColor: '#d3d3d3' }}
                disabledDate={(current) => current && current > moment().endOf('day')}
              />
            </Form.Item>

            <Form.Item
              validateStatus={errors.amount ? 'error' : ''}
              help={errors.amount || ''}
              label={<span style={{ color: '#000000' }}>Amount of Bill (₹)</span>}
              name="amount"
              rules={[{ required: true, message: 'Please enter the amount' }]}
            >
              <Input
                type="number"
                placeholder="Enter amount"
                min={0}
                step="0.01"
                style={{ color: '#000000', background: '#ffffff', borderColor: '#d3d3d3' }}
              />
            </Form.Item>

            <Form.Item
              validateStatus={errors.billImage ? 'error' : ''}
              help={errors.billImage || ''}
              label={<span style={{ color: '#000000' }}>Bill Image</span>}
              name="billImage"
              valuePropName="fileList"
              getValueFromEvent={(e) => (e && e.fileList ? e.fileList : [])}
              rules={[{ required: true, message: 'Please upload a bill image' }]}
            >
              <Dragger {...uploadProps} style={{ background: '#ffffff', borderColor: '#d3d3d3' }}>
                <p className="ant-upload-drag-icon">
                  <UploadOutlined />
                </p>
                <p className="ant-upload-text">Click or drag file to this area to upload</p>
                <p className="ant-upload-hint">
                  Support JPEG, JPG, PNG, and PDF files (max 5MB)
                </p>
              </Dragger>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                style={{
                  background: 'linear-gradient(to right, #34495e, #1a3042)',
                  borderColor: '#34495e',
                  width: '100%',
                  color: '#ffffff',
                }}
              >
                Create Bill Entry
              </Button>
            </Form.Item>
          </Form>
        </Col>
      </Row>
    </div>
  );
};

CreateBillEntry.useLayout = false;

export default CreateBillEntry;