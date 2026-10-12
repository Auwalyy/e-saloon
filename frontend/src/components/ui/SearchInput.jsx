import { HiOutlineSearch, HiX } from 'react-icons/hi';

/** Search box with a leading icon and a clear button. */
const SearchInput = ({ value, onChange, placeholder = 'Search...', className = '' }) => (
  <div className={`relative ${className}`}>
    <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" aria-hidden="true" />
    <input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className="input pl-10 pr-9 [&::-webkit-search-cancel-button]:hidden"
    />
    {value && (
      <button type="button" onClick={() => onChange('')} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700">
        <HiX className="w-4 h-4" />
      </button>
    )}
  </div>
);

export default SearchInput;
