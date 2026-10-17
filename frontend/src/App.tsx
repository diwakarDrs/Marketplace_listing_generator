import { Suspense, lazy } from 'react'
import { Center, Spinner } from '@chakra-ui/react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute } from './components/layout/ProtectedRoute'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const SellersPage = lazy(() => import('./pages/SellersPage'))
const SellerCreatePage = lazy(() => import('./pages/SellerCreatePage'))
const SellerEditPage = lazy(() => import('./pages/SellerEditPage'))
const ProductsPage = lazy(() => import('./pages/ProductsPage'))
const ProductCreatePage = lazy(() => import('./pages/ProductCreatePage'))
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'))
const ProductEditPage = lazy(() => import('./pages/ProductEditPage'))
const GeneratePage = lazy(() => import('./pages/GeneratePage'))
const ListingsPage = lazy(() => import('./pages/ListingsPage'))
const ListingDetailPage = lazy(() => import('./pages/ListingDetailPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))

export default function App() {
  return (
    <Suspense
      fallback={
        <Center h="100vh">
          <Spinner size="xl" color="purple.500" />
        </Center>
      }
    >
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/sellers" element={<SellersPage />} />
            <Route path="/sellers/new" element={<SellerCreatePage />} />
            <Route path="/sellers/:id/edit" element={<SellerEditPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/new" element={<ProductCreatePage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/products/:id/edit" element={<ProductEditPage />} />
            <Route path="/generate" element={<GeneratePage />} />
            <Route path="/listings" element={<ListingsPage />} />
            <Route path="/listings/:id" element={<ListingDetailPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  )
}
