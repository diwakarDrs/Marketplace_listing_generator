import { Box, Flex, HStack, Text } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { ColorModeToggle } from '../ui/ColorModeToggle'
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
        bg="glass"
        backdropFilter="blur(16px) saturate(160%)"
        borderBottomWidth="1px"
        borderColor="navBorder"
        shadow="0 4px 24px -12px rgba(124, 58, 237, 0.3)"
      >
        <HStack gap={6} wrap="wrap">
          <Text
            fontWeight="extrabold"
            fontSize="xl"
            letterSpacing="-0.02em"
            bgImage="var(--grad-text)"
            bgSize="200% auto"
            animation="gradientShift 6s ease infinite"
            bgClip="text"
            color="transparent"
          >
            ✦ ListingGen
          </Text>
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to}>
              {({ isActive }) => (
                <MotionBox
                  position="relative"
                  py={1}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  fontWeight={isActive ? 'bold' : 'medium'}
                  color={isActive ? 'accent' : 'fg'}
                  _hover={{ color: 'accent' }}
                >
                  {item.label}
                  {isActive ? (
                    <MotionBox
                      layoutId="nav-underline"
                      position="absolute"
                      left={0}
                      right={0}
                      bottom="-2px"
                      h="3px"
                      rounded="full"
                      bgImage="linear-gradient(90deg, #9333ea, #ec4899)"
                    />
                  ) : null}
                </MotionBox>
              )}
            </NavLink>
          ))}
        </HStack>
        <HStack gap={3}>
          <ColorModeToggle />
          <GradientButton size="sm" onClick={logout}>
            Log out
          </GradientButton>
        </HStack>
      </Flex>
      <Box as="main" px={6} py={8} maxW="7xl" mx="auto">
        <Outlet />
      </Box>
    </Box>
  )
}
