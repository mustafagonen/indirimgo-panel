'use client'

import React, { useState, useRef, useEffect } from 'react'

export interface SelectOption {
  value: string
  label: string
  icon?: string | React.ReactNode
  sublabel?: string
}

interface CustomSelectProps {
  id?: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  searchable?: boolean
  className?: string
  style?: React.CSSProperties
}

export default function CustomSelect({
  id,
  value,
  onChange,
  options,
  placeholder = 'Seçiniz...',
  disabled = false,
  searchable = false,
  className = '',
  style = {},
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const filteredOptions = searchable && searchQuery
    ? options.filter(opt =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : options

  return (
    <div
      ref={containerRef}
      className={`custom-select-container ${disabled ? 'disabled' : ''} ${isOpen ? 'open' : ''} ${className}`}
      style={{ position: 'relative', width: '100%', ...style }}
      id={id ? `select-wrapper-${id}` : undefined}
    >
      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        className="custom-select-trigger"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span className="custom-select-value">
          {selectedOption ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
              {selectedOption.icon && <span className="custom-select-icon">{selectedOption.icon}</span>}
              <span className="truncate">{selectedOption.label}</span>
            </span>
          ) : (
            <span className="custom-select-placeholder">{placeholder}</span>
          )}
        </span>
        <span className="custom-select-arrow">▾</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="custom-select-dropdown animate-fade-in">
          {searchable && (
            <div className="custom-select-search">
              <input
                type="text"
                placeholder="Ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          <div className="custom-select-options">
            {filteredOptions.length === 0 ? (
              <div className="custom-select-no-options">Sonuç bulunamadı</div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value
                return (
                  <div
                    key={opt.value}
                    className={`custom-select-option ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      onChange(opt.value)
                      setIsOpen(false)
                      setSearchQuery('')
                    }}
                  >
                    {opt.icon && <span className="custom-select-icon">{opt.icon}</span>}
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div className="custom-select-option-label truncate">{opt.label}</div>
                      {opt.sublabel && (
                        <div className="custom-select-option-sublabel truncate">{opt.sublabel}</div>
                      )}
                    </div>
                    {isSelected && <span className="custom-select-checkmark">✓</span>}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
