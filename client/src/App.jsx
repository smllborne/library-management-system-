import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import BookDetail from './pages/BookDetail.jsx'
import HomePage from './pages/HomePage.jsx'
import './App.css'

function BookDetailRoute({ navigate }) {
  const { id } = useParams()
  return <BookDetail bookId={id} navigate={navigate} />
}

function App() {
  const routerNavigate = useNavigate()
  const navigate = (path) => {
    routerNavigate(path)
    window.scrollTo(0, 0)
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <Link className="brand" to="/" onClick={() => window.scrollTo(0, 0)}>
          <span className="brand-mark" aria-hidden="true">B</span>
          <span>Between <em>the</em> Lines</span>
        </Link>
        <span className="header-note">Your neighborhood library</span>
      </header>
      <Routes>
        <Route path="/" element={<HomePage navigate={navigate} />} />
        <Route path="/books/:id" element={<BookDetailRoute navigate={navigate} />} />
      </Routes>
      <footer className="site-footer">
        <span>Made for curious minds.</span>
        <span>Find your next favorite.</span>
      </footer>
    </div>
  )
}

export default App
