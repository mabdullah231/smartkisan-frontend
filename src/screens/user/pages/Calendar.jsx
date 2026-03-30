import React, { useContext, useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { DarkModeContext, LanguageContext } from '../../DashboardLayout'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import axios from 'axios'
import Helpers from '../../../config/Helpers'

const UserCalendar = () => {
  const darkMode = useContext(DarkModeContext)
  const language = useContext(LanguageContext)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [suggestionRows, setSuggestionRows] = useState([])
  const modalRef = useRef(null)

  const loadCalendarEvents = useCallback(async (dateInfo) => {
    const start = dateInfo.startStr.slice(0, 10)
    const endExclusive = new Date(dateInfo.endStr)
    endExclusive.setDate(endExclusive.getDate() - 1)
    const ey = endExclusive.getFullYear()
    const em = String(endExclusive.getMonth() + 1).padStart(2, '0')
    const ed = String(endExclusive.getDate()).padStart(2, '0')
    const endInclusive = `${ey}-${em}-${ed}`
    try {
      const res = await axios.get(`${Helpers.apiUrl}suggestions/me/calendar`, {
        params: { start_date: start, end_date: endInclusive },
        ...Helpers.getAuthHeaders(),
      })
      if (res.data.success && Array.isArray(res.data.data)) {
        setSuggestionRows(res.data.data)
      } else {
        setSuggestionRows([])
      }
    } catch (e) {
      console.error('Calendar suggestions failed', e)
      setSuggestionRows([])
    }
  }, [])

  const calendarEvents = useMemo(
    () =>
      suggestionRows.map((item) => ({
        title: language === 'urdu' ? item.ur_title : item.eng_title,
        date: item.advice_date,
        extendedProps: {
          description:
            language === 'urdu' ? item.ur_description : item.eng_description,
        },
      })),
    [suggestionRows, language]
  )

  // Close modal on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setSelectedEvent(null)
      }
    }

    if (selectedEvent) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [selectedEvent])

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      <h1 className={`text-2xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-black'}`}>
        {language === "urdu" ? "کیلنڈر" : "Calendar"}
      </h1>

      <div className={`flex-1 ${darkMode ? 'dark' : 'light'}`}>
        <FullCalendar
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          height="100%"
          datesSet={(dateInfo) => {
            loadCalendarEvents(dateInfo)
          }}
          eventClick={(info) => {
            setSelectedEvent(info.event)
          }}
          events={calendarEvents}
        />
      </div>

      {/* ===== MODAL ===== */}
      {selectedEvent && (
        <div className="modal-backdrop animate-fade-in">
          <div
            ref={modalRef}
            className={`modal animate-message-in shadow-transition ${darkMode ? 'modal-dark' : 'modal-light'
              }`}
          >
            <button className="modal-close" onClick={() => setSelectedEvent(null)}>
              ✕
            </button>

            <h2 className="modal-title">{selectedEvent.title}</h2>
            <p className="modal-date">
              {selectedEvent.start.toDateString()}
            </p>

            <p className="modal-description">
              {selectedEvent.extendedProps.description}
            </p>
          </div>
        </div>
      )}

      {/* ===== STYLES ===== */}
      <style jsx global>{`
        /* ========================= */
        /* MODAL BACKDROP */
        /* ========================= */
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 50;
          padding: 16px;
        }

        /* ========================= */
        /* MODAL */
        /* ========================= */
        .modal {
          width: 100%;
          max-width: 420px;
          border-radius: 12px;
          padding: 20px;
          position: relative;
        }

        .modal-light {
          background: #ffffff;
          color: #111827;
          box-shadow: 0 0 10px 0 rgba(0, 0, 0, 1);
        }

        .modal-dark {
          background: #020617;
          color: #e5e7eb;
          box-shadow: 0 0 10px 0 rgba(63, 63, 63, 1);
        }

        .modal-title {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .modal-date {
          font-size: 13px;
          opacity: 0.7;
          margin-bottom: 12px;
        }

        .modal-description {
          font-size: 14px;
          line-height: 1.5;
        }

        /* ========================= */
        /* CLOSE BUTTON */
        /* ========================= */
        .modal-close {
          position: absolute;
          top: 12px;
          right: 12px;
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: inherit;
        }

        /* ========================= */
        /* ANIMATIONS (YOUR EXACT ONES) */
        /* ========================= */
        @keyframes messageIn {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-message-in {
          animation: messageIn 0.3s ease-out forwards;
        }

        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }

        .shadow-transition {
          transition: box-shadow 0.3s ease;
        }
                  /* ========================= */
        /* HEADER (Mon Tue Wed etc.) */
        /* ========================= */
        .dark .fc-col-header-cell-cushion {
          color: #e5e7eb; /* gray-200 */
        }

        .light .fc-col-header-cell-cushion {
          color: #111827; /* gray-900 */
        }

        /* ========================= */
        /* DAY NUMBER (1,2,3...) */
        /* ========================= */
        .dark .fc-daygrid-day-number {
          color: #d1d5db; /* gray-300 */
        }

        .light .fc-daygrid-day-number {
          color: #1f2937; /* gray-800 */
        }
        .dark .fc-toolbar-title{
            color: #e5e7eb; /* gray-200 */
        }

        .fc-today-button{
          text-transform: capitalize !important;
        }

        .light .fc .fc-button-primary {
            background-color: #22c55e;
            border-color: #22c55e;
        }
        .light .fc .fc-button-primary:hover {
            background-color:rgb(15, 147, 63);
            border-color: rgb(15, 147, 63);
        }


        /* ========================= */
        /* DAY CELL BACKGROUND */
        /* ========================= */
        .dark .fc-daygrid-day {
          background-color: #020617; /* slate-950 */
        }

        .light .fc-daygrid-day {
          background-color: #ffffff;
        }

        /* ========================= */
        /* TODAY HIGHLIGHT */
        /* ========================= */
        .dark .fc-day-today {
          background-color: rgba(59, 130, 246, 0.15) !important;
        }

        .light .fc-day-today {
          background-color: rgba(34, 197, 94, 0.15) !important;
        }

        /* ========================= */
        /* EVENT TITLE */
        /* ========================= */
        .fc-event {
          
          border: none;
          border-radius: 6px;
          padding: 2px 6px;
        }

        .light .fc-event {
          background-color: #22c55e; /* green-500 */
          color: #064e3b; /* green-900 */
        }

        .dark .fc-event {
          background-color: #374151; /* gray-700 */
          color: #f9fafb; /* gray-50 */
        }

        .fc-event-title {
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
        }

        /* ========================= */
        /* GRID BORDERS */
        /* ========================= */
        .dark .fc-scrollgrid,
        .dark .fc-scrollgrid td,
        .dark .fc-scrollgrid th {
          border-color: #1f2937;
        }
      `}</style>
    </div>
  )
}

export default UserCalendar
