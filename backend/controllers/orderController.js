const Order = require('../models/Order');
const BillCounter = require('../models/BillCounter');
const Branch = require('../models/Branch');
const Table = require('../models/Table');
const Inventory = require('../models/Inventory');
const { reduceStock } = require('./inventoryController');

const createOrder = async (req, res) => {
  try {
    const {
      branchId,
      tab,
      products,
      paymentMethod,
      subtotal,
      totalGST,
      totalWithGST,
      totalItems,
      status,
      waiterId,
      deliveryDateTime,
      tableId,
    } = req.body;

    if (
      !branchId ||
      !tab ||
      !products ||
      !paymentMethod ||
      subtotal === undefined ||
      totalGST === undefined ||
      totalWithGST === undefined ||
      totalItems === undefined
    ) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: 'Products array cannot be empty' });
    }

    for (const product of products) {
      if (
        !product.productId ||
        !product.name ||
        !product.quantity ||
        !product.price ||
        !product.unit ||
        product.gstRate === undefined || // Allow "non-gst" or number
        !product.productTotal ||
        product.productGST === undefined ||
        product.bminstock === undefined
      ) {
        return res.status(400).json({ message: 'Invalid product data' });
      }
      // Validate gstRate
      if (!(typeof product.gstRate === 'number' && product.gstRate >= 0) && product.gstRate !== 'non-gst') {
        return res.status(400).json({ message: 'gstRate must be a non-negative number or "non-gst"' });
      }
      // Ensure productGST is 0 for non-gst items
      if (product.gstRate === 'non-gst' && product.productGST !== 0) {
        return res.status(400).json({ message: 'Non-GST items must have productGST set to 0' });
      }
      product.sendingQty = product.sendingQty !== undefined ? product.sendingQty : 0;
      product.confirmed = product.confirmed !== undefined ? product.confirmed : false;
    }

    const branch = await Branch.findById(branchId);
    if (!branch) return res.status(404).json({ message: 'Branch not found' });
    const branchName = branch.name || `Branch ${branchId}`;
    const branchPrefix = branchName.substring(0, 3).toUpperCase();

    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = String(today.getFullYear()).slice(-2);
    const dateStr = `${today.getFullYear()}-${month}-${day}`;

    let billCounter = await BillCounter.findOne({ branchId, date: dateStr });
    if (!billCounter) {
      billCounter = new BillCounter({ branchId, date: dateStr, count: 1 });
    } else {
      billCounter.count += 1;
    }
    await billCounter.save();

    const billCount = String(billCounter.count).padStart(2, '0');
    const billNo = `${branchPrefix}${day}${month}${year}${billCount}`;

    let table = null;
    if (tab === 'tableOrder' && tableId) {
      table = await Table.findById(tableId);
      if (!table) return res.status(404).json({ message: 'Table not found' });
      if (table.status === 'Occupied' && table.currentOrder) {
        return res.status(400).json({ message: 'Table is already occupied with an active order' });
      }
    }

    const order = new Order({
      branchId,
      tab,
      products,
      paymentMethod,
      subtotal,
      totalGST,
      totalWithGST,
      totalItems,
      status: status || 'draft',
      billNo,
      waiterId: waiterId || null,
      deliveryDateTime: deliveryDateTime ? new Date(deliveryDateTime) : null,
      tableId: tableId || null,
    });

    const savedOrder = await order.save();

    // Reduce branch stock if status is "completed" (for billing)
    if (status === 'completed') {
      await reduceStock(branchId, products);
    }

    if (tab === 'tableOrder' && table) {
      if (status === 'draft') {
        table.status = 'Occupied';
        table.currentOrder = savedOrder._id;
      } else if (status === 'completed') {
        table.status = 'Free';
        table.currentOrder = null;
      }
      await table.save();
    }

    const populatedOrder = await Order.findById(savedOrder._id)
      .populate('branchId')
      .populate('waiterId', 'name')
      .populate('tableId');

    res.status(201).json({ message: 'Order saved successfully', order: populatedOrder });
  } catch (error) {
    console.error('Error saving order:', error);
    res.status(500).json({ message: 'Error saving order', error: error.message });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const { branchId } = req.query;
    const query = { tab: { $in: ['stock', 'liveOrder'] } };
    if (branchId) query.branchId = branchId;

    const orders = await Order.find(query)
      .populate('branchId', 'name')
      .populate('waiterId', 'name')
      .populate('tableId', 'tableNo');
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

const updateStockOrderStatus = async () => {
  try {
    const now = new Date();
    console.log(`[${now.toISOString()}] Checking for overdue orders`);

    const overdueStockOrders = await Order.find({
      tab: 'stock',
      status: 'neworder',
      deliveryDateTime: { $lt: now },
    });

    const threeHoursAgo = new Date(now - 3 * 60 * 60 * 1000);
    const overdueLiveOrders = await Order.find({
      tab: 'liveOrder',
      status: 'neworder',
      createdAt: { $lt: threeHoursAgo },
    });

    const allOverdueOrders = [...overdueStockOrders, ...overdueLiveOrders];

    if (allOverdueOrders.length > 0) {
      console.log(`Found ${allOverdueOrders.length} overdue orders:`, allOverdueOrders.map(o => o._id));
      await Order.updateMany(
        { _id: { $in: allOverdueOrders.map(order => order._id) } },
        { $set: { status: 'pending' } }
      );
      console.log('Updated overdue orders to pending');
    } else {
      console.log('No overdue orders found');
    }
  } catch (error) {
    console.error('Error updating order status:', error);
  }
};

const updateSendingQty = async (req, res) => {
  try {
    const { id } = req.params;
    const { products, status } = req.body;

    if (!products && !status) {
      return res.status(400).json({ message: 'At least one of products or status must be provided' });
    }

    const order = await Order.findById(id).populate('branchId', 'name');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (products) {
      if (!Array.isArray(products)) {
        return res.status(400).json({ message: 'Products must be an array' });
      }

      const updatedProducts = order.products.map((existingProduct, index) => {
        const newProduct = products[index] || {};
        return {
          ...existingProduct.toObject(),
          sendingQty: newProduct.sendingQty !== undefined ? newProduct.sendingQty : existingProduct.sendingQty || 0,
          confirmed: newProduct.confirmed !== undefined ? newProduct.confirmed : existingProduct.confirmed || false,
          // Preserve gstRate and productGST integrity
          gstRate: newProduct.gstRate !== undefined ? newProduct.gstRate : existingProduct.gstRate,
          productGST: newProduct.gstRate === 'non-gst' ? 0 : (newProduct.productGST !== undefined ? newProduct.productGST : existingProduct.productGST),
        };
      });
      order.products = updatedProducts;
    }

    if (status) {
      const validStatuses = ['neworder', 'pending', 'completed', 'draft', 'delivered', 'received'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }

      if (status === 'delivered' && order.status !== 'completed') {
        return res.status(400).json({ message: 'Order must be completed before marking as delivered' });
      }
      if (status === 'received' && order.status !== 'delivered') {
        return res.status(400).json({ message: 'Order must be delivered before marking as received' });
      }

      if (status === 'delivered' && (order.tab === 'stock' || order.tab === 'liveOrder')) {
        for (const product of order.products) {
          if (product.sendingQty > 0) {
            let factoryInventory = await Inventory.findOne({ productId: product.productId, locationId: null });
            if (!factoryInventory) {
              return res.status(400).json({ message: `No factory stock found for product ${product.name}` });
            }
            if (factoryInventory.inStock < product.sendingQty) {
              return res.status(400).json({ message: `Insufficient factory stock for ${product.name}` });
            }
            factoryInventory.inStock -= product.sendingQty;
            factoryInventory.stockHistory.push({
              date: new Date(),
              change: -product.sendingQty,
              reason: `Transferred to ${order.branchId.name} (${order.tab === 'stock' ? 'Stock' : 'Live'} Order)`,
            });
            await factoryInventory.save();

            let branchInventory = await Inventory.findOne({ productId: product.productId, locationId: order.branchId });
            if (!branchInventory) {
              branchInventory = new Inventory({
                productId: product.productId,
                locationId: order.branchId,
                inStock: 0,
                lowStockThreshold: 5,
              });
            }
            branchInventory.inStock += product.sendingQty;
            branchInventory.stockHistory.push({
              date: new Date(),
              change: product.sendingQty,
              reason: `Received from Factory (${order.tab === 'stock' ? 'Stock' : 'Live'} Order)`,
            });
            await branchInventory.save();
          }
        }
        order.deliveredAt = new Date();
      } else if (status === 'received') {
        order.receivedAt = new Date();
      }
      order.status = status;
    }

    const updatedOrder = await order.save();
    const populatedOrder = await Order.findById(updatedOrder._id)
      .populate('branchId', 'name')
      .populate('waiterId', 'name')
      .populate('tableId', 'tableNo');

    res.status(200).json({ message: 'Order updated successfully', order: populatedOrder });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ message: 'Error updating order', error: error.message });
  }
};

module.exports = { createOrder, getAllOrders, updateStockOrderStatus, updateSendingQty };