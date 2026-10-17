import { Box, Flex, HStack, Text } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { GradientButton } from '../ui/GradientButton'
import { MeshBackground } from './MeshBackground'

const MotionBox = motion.create(Box)

interface NavItem {
  label: string
  to: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Products', to: '/products' },
  { label: 'Sellers', to: '/sellers' },
  { label: 'Generate', to: '/generate' },
  { label: 'Listings', to: '/listings' },
  { label: 'Profile', to: '/profile' },
]

export function AppLayout() {
  const { logout } = useAuth()
  return (
    <Box minH="100vh">
      <MeshBackground />
      <Flex
        as="nav"
        aria-label="Main navigation"
        position="sticky"
        top={0}
        zIndex={10}
        px={6}
        py={3}
        align="center"
        justify="space-between"
        bg="whiteAlpha.800"
        backdropFilter="blur(12px)"
        borderBottomWidth="1px"
      >
        <HStack gap={6} wrap="wrap">
          <Text fontWeight="bold" fontSize="lg" color="purple.600">
            ListingGen
          </Text>
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to}>
              {({ isActive }) => (
                <MotionBox
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  fontWeight={isActive ? 'bold' : 'medium'}
                  color={isActive ? 'purple.600' : 'gray.700'}
                >
                  {item.label}
                </MotionBox>
              )}
            </NavLink>
          ))}
        </HStack>
        <GradientButton size="sm" onClick={logout}>
          Log out
        </GradientButton>
      </Flex>
      <Box as="main" px={6} py={8} maxW="7xl" mx="auto">
        <Outlet />
      </Box>
    </Box>
  )
}
