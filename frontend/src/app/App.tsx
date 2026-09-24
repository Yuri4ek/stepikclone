import { Providers } from './providers'
import { AppRouter } from './router/AppRouter'
import './styles/index.css'

export default function App() {
  return (
    <Providers>
      <AppRouter />
    </Providers>
  )
}
