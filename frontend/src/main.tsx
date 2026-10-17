import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ChakraProvider } from '@chakra-ui/react'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ListingToaster } from './components/listings/ListingToaster'
import { AuthProvider } from './context/AuthContext'
import { ColorModeProvider } from './context/ColorModeContext'
import { system } from './theme'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChakraProvider value={system}>
      <ColorModeProvider>
        <ListingToaster />
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </ColorModeProvider>
    </ChakraProvider>
  </StrictMode>,
)
