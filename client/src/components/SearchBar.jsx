import { useEffect, useState } from 'react'

function SearchBar({ onSearch }) {
  const [value, setValue] = useState('')

  useEffect(() => {
    const timeoutId = window.setTimeout(() => onSearch(value.trim()), 350)
    return () => window.clearTimeout(timeoutId)
  }, [value, onSearch])

  return (
    <label className="search-field">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m16 16 4.2 4.2" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search by title or author..."
        aria-label="Search books by title or author"
      />
      {value && (
        <button className="search-clear" type="button" onClick={() => setValue('')} aria-label="Clear search">
          ×
        </button>
      )}
    </label>
  )
}

export default SearchBar
