import React, { useState, useEffect } from 'react';
import { getOrders, createOrder, getProducts, getUsers } from '../services/api';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    userId: '',
    productId: '',
    quantity: '1'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ordersRes, productsRes, usersRes] = await Promise.all([
        getOrders(),
        getProducts(),
        getUsers()
      ]);
      setOrders(ordersRes.data.data || []);
      setProducts(productsRes.data.data || []);
      setUsers(usersRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Please check if all services are running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.userId || !formData.productId) {
      alert('Please select both a user and a product');
      return;
    }

    try {
      await createOrder({
        userId: formData.userId,
        productId: formData.productId,
        quantity: parseInt(formData.quantity)
      });
      setFormData({ userId: '', productId: '', quantity: '1' });
      fetchData();
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Error creating order. Make sure the user and product exist!');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getUserName = (userId) => {
    const user = users.find(u => u._id === userId);
    return user ? user.name : userId;
  };

  const getProductName = (productId) => {
    const product = products.find(p => p._id === productId);
    return product ? product.name : productId;
  };

  if (loading) return <div className="loading">Loading orders</div>;

  return (
    <div className="container">
      <h2>🛒 Orders Management</h2>
      
      {error && <div className="error">{error}</div>}
      
      {(products.length === 0 || users.length === 0) && (
        <div className="error">
          Please create at least one product and one user before creating orders!
        </div>
      )}
      
      <form className="form" onSubmit={handleSubmit}>
        <select
          name="userId"
          value={formData.userId}
          onChange={handleChange}
          required
        >
          <option value="">Select User</option>
          {users.map((user) => (
            <option key={user._id} value={user._id}>
              {user.name} ({user.email})
            </option>
          ))}
        </select>

        <select
          name="productId"
          value={formData.productId}
          onChange={handleChange}
          required
        >
          <option value="">Select Product</option>
          {products.map((product) => (
            <option key={product._id} value={product._id}>
              {product.name} - ${product.price} (Stock: {product.stock})
            </option>
          ))}
        </select>

        <input
          type="number"
          name="quantity"
          placeholder="Quantity"
          min="1"
          value={formData.quantity}
          onChange={handleChange}
          required
        />
        <button type="submit">Create Order</button>
      </form>

      <div className="list">
        {orders.length === 0 ? (
          <div className="empty">No orders yet. Create your first order above!</div>
        ) : (
          orders.map((order) => (
            <div key={order._id} className="item">
              <div className="item-info">
                <h3>Order #{order._id.slice(-6).toUpperCase()}</h3>
                <p><strong>Customer:</strong> {getUserName(order.userId)}</p>
                <p><strong>Product:</strong> {getProductName(order.productId)}</p>
                <p><strong>Quantity:</strong> {order.quantity}</p>
                <p><strong>Total Price:</strong> ${order.totalPrice}</p>
                <p>
                  <strong>Status:</strong> 
                  <span style={{
                    color: order.status === 'completed' ? '#10b981' : 
                           order.status === 'pending' ? '#f59e0b' : '#ef4444',
                    marginLeft: '0.5rem',
                    fontWeight: 'bold'
                  }}>
                    {order.status.toUpperCase()}
                  </span>
                </p>
                <p style={{ fontSize: '0.85rem', color: '#999' }}>
                  Created: {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Orders;