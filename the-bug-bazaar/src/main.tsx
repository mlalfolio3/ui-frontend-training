import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import { setUnauthorizedHandler } from './api/client.ts'
import { store } from './store/store.ts'
import { clearSession } from './store/sessionSlice.ts'
import './index.css'

setUnauthorizedHandler(() => {
  store.dispatch(clearSession())
})

const root = document.getElementById('root')
if (!root) throw new Error('Missing root element')

createRoot(root).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>,
)
