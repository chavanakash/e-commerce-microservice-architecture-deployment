import React, { useState } from 'react';
import Products from './components/Products';
import Orders from './components/Orders';
import Users from './components/Users';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('products');

  return (
    <div className="App">
      <header className="header">
        <h1>🛍️ E-Commerce Microservices</h1>
        <p>Simple DevOps Demo Application</p>
      </header>

      <nav className="nav">
        <button
          className={activeTab === 'products' ? 'active' : ''}
          onClick={() => setActiveTab('products')}
        >
          Products
        </button>
        <button
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
        <button
          className={activeTab === 'orders' ? 'active' : ''}
          onClick={() => setActiveTab('orders')}
        >
          Orders
        </button>
      </nav>

      <main className="main">
        {activeTab === 'products' && <Products />}
        {activeTab === 'users' && <Users />}
        {activeTab === 'orders' && <Orders />}
      </main>
    </div>
  );
}

export default App;