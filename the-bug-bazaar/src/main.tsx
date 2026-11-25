import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import App from './App.tsx'
import { installBrowserApi } from './api/browserApi.ts'
import { setUnauthorizedHandler } from './api/client.ts'
import { store } from './store/store.ts'
import { clearSession } from './store/sessionSlice.ts'
import './index.css'

setUnauthorizedHandler(() => {
  store.dispatch(clearSession())
})

if (import.meta.env.VITE_PUBLIC_DEMO === 'true') installBrowserApi()

const Router = import.meta.env.MODE === 'pages' ? HashRouter : BrowserRouter

const root = document.getElementById('root')
if (!root) throw new Error('Missing root element')

createRoot(root).render(
  <StrictMode>
    <Provider store={store}>
      <Router>
        <App />
      </Router>
    </Provider>
  </StrictMode>,
)
