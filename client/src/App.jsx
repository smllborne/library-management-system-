import { useEffect, useState } from 'react'
import BookDetail from './pages/BookDetail.jsx'
import HomePage from './pages/HomePage.jsx'
import './App.css'

function App() {
  const [pathname, setPathname] = useState(window.location.pathname)

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = (path) => {
    window.history.pushState({}, '', path)
    setPathname(path)
    window.scrollTo(0, 0)
  }

  const bookMatch = pathname.match(/^\/books\/(\d+)\/?$/)

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="/" onClick={(event) => {
          event.preventDefault()
          navigate('/')
        }}>
          <span className="brand-mark" aria-hidden="true">B</span>
          <span>Between <em>the</em> Lines</span>
        </a>
        <span className="header-note">Your neighborhood library</span>
      </header>
      {bookMatch
        ? <BookDetail bookId={bookMatch[1]} navigate={navigate} />
        : <HomePage navigate={navigate} />}
      <footer className="site-footer">
        <span>Made for curious minds.</span>
        <span>Find your next favorite.</span>
      </footer>
    </div>
  )
}

export default App
