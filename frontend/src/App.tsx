import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import Settings from './pages/Settings';
import Help from './pages/Help';
import Planning from './pages/Planning';
import Login from './pages/Login';
import History from './pages/History';
import OrderDetail from './pages/OrderDetail';
import { ApiEvent, RecommendResponse, OrderRecord } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<ApiEvent | null>(null);
  const [lastRecommendation, setLastRecommendation] = useState<RecommendResponse | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  const handlePlanEvent = (event: ApiEvent) => {
    setSelectedEvent(event);
    setActiveTab('planning');
  };

  const handleRecommendation = (recommendation: RecommendResponse) => {
    setLastRecommendation(recommendation);
  };

  const handleViewOrder = (order: OrderRecord) => {
    setSelectedOrder(order);
    setActiveTab('order-detail');
  };

  const handleBackFromOrderDetail = () => {
    setSelectedOrder(null);
    setActiveTab('history');
  };

  return (
    <div className="bg-surface text-primary antialiased overflow-hidden flex h-screen w-full">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onSignOut={() => setIsLoggedIn(false)} />
      <main className="ml-64 flex-1 flex flex-col h-screen overflow-hidden bg-surface">
        <Header />
        <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col">
          {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} onPlanEvent={handlePlanEvent} />}
          {activeTab === 'events' && <Events onPlanEvent={handlePlanEvent} />}
          {activeTab === 'history' && <History onViewOrder={handleViewOrder} />}
          {activeTab === 'settings' && <Settings />}
          {activeTab === 'help' && <Help />}
          {activeTab === 'planning' && (
            <Planning
              event={selectedEvent}
              onRecommendation={handleRecommendation}
            />
          )}
          {activeTab === 'order-detail' && (
            <OrderDetail
              order={selectedOrder}
              onBack={handleBackFromOrderDetail}
            />
          )}
        </div>
      </main>
    </div>
  );
}
