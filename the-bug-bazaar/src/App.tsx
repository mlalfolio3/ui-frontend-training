import { useLocation, Route, Routes } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { Layout } from './components/Layout.tsx'
import { ProtectedRoute } from './components/ProtectedRoute.tsx'
import { AccountPage } from './pages/AccountPage.tsx'
import { CartPage } from './pages/CartPage.tsx'
import { CheckoutPage } from './pages/CheckoutPage.tsx'
import { CrashPage } from './pages/CrashPage.tsx'
import { CustomerDetailPage } from './pages/CustomerDetailPage.tsx'
import { DeskPage } from './pages/DeskPage.tsx'
import { LoginPage } from './pages/LoginPage.tsx'
import { NotFoundPage } from './pages/NotFoundPage.tsx'
import { OrderPage } from './pages/OrderPage.tsx'
import { ProductDetailPage } from './pages/ProductDetailPage.tsx'
import { ProductsPage } from './pages/ProductsPage.tsx'

function RoutedApp() {
  const location = useLocation()
  return (
    <Layout>
      <ErrorBoundary key={location.pathname}>
        <Routes>
          <Route path="/" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
          <Route path="/orders/:id" element={<ProtectedRoute><OrderPage /></ProtectedRoute>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
          <Route path="/desk" element={<DeskPage />} />
          <Route path="/desk/customers/:id" element={<CustomerDetailPage />} />
          <Route path="/preview-crash" element={<CrashPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ErrorBoundary>
    </Layout>
  )
}

export default function App() {
  return <RoutedApp />
}
