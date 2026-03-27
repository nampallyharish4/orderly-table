import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { OrderProvider } from '@/contexts/OrderContext';
import { LoadingProvider } from '@/contexts/LoadingContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import { ThemeProvider } from '@/components/theme-provider';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TablesPage from './pages/TablesPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import NewOrderPage from './pages/NewOrderPage';
import KitchenPage from './pages/KitchenPage';
import BillingPage from './pages/BillingPage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';
import MenuManagementPage from './pages/MenuManagementPage';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

// Main App component with AuthProvider wrapping all routes
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LoadingProvider>
        <ThemeProvider>
          <AuthProvider>
            <OrderProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <MainLayout>
                          <DashboardPage />
                        </MainLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/tables"
                    element={
                      <ProtectedRoute>
                        <MainLayout>
                          <TablesPage />
                        </MainLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/orders"
                    element={
                      <ProtectedRoute>
                        <MainLayout>
                          <OrdersPage />
                        </MainLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/orders/:id"
                    element={
                      <ProtectedRoute>
                        <MainLayout>
                          <OrderDetailPage />
                        </MainLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/orders/new"
                    element={
                      <ProtectedRoute>
                        <MainLayout>
                          <NewOrderPage />
                        </MainLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/kitchen"
                    element={
                      <ProtectedRoute>
                        <MainLayout>
                          <KitchenPage />
                        </MainLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/billing"
                    element={
                      <ProtectedRoute>
                        <MainLayout>
                          <BillingPage />
                        </MainLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/reports"
                    element={
                      <ProtectedRoute>
                        <MainLayout>
                          <ReportsPage />
                        </MainLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/users"
                    element={
                      <ProtectedRoute>
                        <MainLayout>
                          <UsersPage />
                        </MainLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/menu"
                    element={
                      <ProtectedRoute>
                        <MainLayout>
                          <MenuManagementPage />
                        </MainLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <MainLayout>
                          <SettingsPage />
                        </MainLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </OrderProvider>
          </AuthProvider>
        </ThemeProvider>
      </LoadingProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
