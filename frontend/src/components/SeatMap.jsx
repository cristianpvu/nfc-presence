import { useEffect, useRef, useState } from 'react';
import { formatTime } from '../format';
import { initials, nameLines } from '../names';

const DESK_WIDTH = 64;
const DESK_HEIGHT = 40;
const GAP = 10;
const PADDING = 16;
const BOARD_HEIGHT = 32;
const NAME_FONT_SIZE = 10;
const NAME_LINE_HEIGHT = 12;
const NAME_MAX_WIDTH = DESK_WIDTH - 8;
const MIN_NAME_SCALE = 0.8;

export default function SeatMap({ desks, occupants, selectedId, onSelect }) {
  const [scale, setScale] = useState(1);
  const popoverRef = useRef(null);
  const wrapRef = useRef(null);

  const cols = Math.max(1, ...desks.map(desk => desk.col));
  const rows = Math.max(1, ...desks.map(desk => desk.row));
  const boardTop = PADDING + rows * DESK_HEIGHT + (rows - 1) * GAP + GAP * 3;
  const width = PADDING * 2 + cols * DESK_WIDTH + (cols - 1) * GAP;
  const height = boardTop + BOARD_HEIGHT + PADDING;

  useEffect(() => {
    if (!wrapRef.current) return;
    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / width));
    observer.observe(wrapRef.current);
    return () => observer.disconnect();
  }, [width]);

  useEffect(() => {
    if (!selectedId) return;
    const close = event => {
      if (popoverRef.current?.contains(event.target) || event.target.closest('.desk.taken')) return;
      onSelect(null);
    };
    const closeOnEscape = event => event.key === 'Escape' && onSelect(null);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [selectedId, onSelect]);

  if (desks.length === 0) return <p className="muted">Sala nu are bănci configurate.</p>;

  const showNames = scale >= MIN_NAME_SCALE;
  const nameFont = `700 ${NAME_FONT_SIZE}px ${getComputedStyle(document.body).fontFamily}`;

  const position = desk => ({
    x: PADDING + (desk.col - 1) * (DESK_WIDTH + GAP),
    y: PADDING + (rows - desk.row) * (DESK_HEIGHT + GAP),
  });

  const toggle = desk => onSelect(selectedId === desk._id ? null : desk._id);

  function deskText(desk, x, y) {
    const centerX = x + DESK_WIDTH / 2;
    const centerY = y + DESK_HEIGHT / 2;
    const occupant = occupants.get(desk._id);
    if (!occupant) return <text x={centerX} y={centerY}>{desk.label}</text>;
    if (!showNames) return <text x={centerX} y={centerY}>{initials(occupant.studentName)}</text>;

    const lines = nameLines(occupant.studentName, NAME_MAX_WIDTH, nameFont);
    const firstY = centerY - ((lines.length - 1) * NAME_LINE_HEIGHT) / 2;
    return (
      <text className="desk-name">
        {lines.map((line, index) => (
          <tspan key={index} x={centerX} y={firstY + index * NAME_LINE_HEIGHT}>{line}</tspan>
        ))}
      </text>
    );
  }

  const selectedDesk = desks.find(desk => desk._id === selectedId);
  const selected = selectedDesk && occupants.get(selectedDesk._id);

  let popover = null;
  if (selected) {
    const { x, y } = position(selectedDesk);
    const below = selectedDesk.row === rows;
    const style = { top: `${((below ? y + DESK_HEIGHT : y) / height) * 100}%` };
    let align = 'center';
    if (selectedDesk.col === 1) {
      style.left = `${(x / width) * 100}%`;
      align = 'start';
    } else if (selectedDesk.col === cols) {
      style.right = `${((width - x - DESK_WIDTH) / width) * 100}%`;
      align = 'end';
    } else {
      style.left = `${((x + DESK_WIDTH / 2) / width) * 100}%`;
    }
    popover = (
      <div ref={popoverRef} className={`seat-popover ${below ? 'below' : 'above'} ${align}`} style={style} role="tooltip">
        <div className="seat-popover-name">{selected.studentName}</div>
        {selected.studentId && <div className="seat-popover-id">{selected.studentId}</div>}
        <div className="seat-popover-time">{formatTime(selected.createdAt)}</div>
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="seat-map-wrap" style={{ maxWidth: width }}>
      <svg className="seat-map" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Plan sală">
        <rect className="board" x={PADDING} y={boardTop} width={width - PADDING * 2} height={BOARD_HEIGHT} rx="4" />
        <text className="board-label" x={width / 2} y={boardTop + BOARD_HEIGHT / 2}>Catedră</text>
        {desks.map(desk => {
          const occupant = occupants.get(desk._id);
          const { x, y } = position(desk);
          const classes = ['desk', occupant && 'taken', desk._id === selectedId && 'selected'].filter(Boolean).join(' ');
          return (
            <g
              key={desk._id}
              className={classes}
              onClick={() => occupant && toggle(desk)}
              onKeyDown={event => occupant && event.key === 'Enter' && toggle(desk)}
              tabIndex={occupant ? 0 : undefined}
              role={occupant ? 'button' : undefined}
            >
              <title>{occupant ? `${desk.label} · ${occupant.studentName}` : desk.label}</title>
              <rect x={x} y={y} width={DESK_WIDTH} height={DESK_HEIGHT} rx="4" />
              {deskText(desk, x, y)}
            </g>
          );
        })}
      </svg>
      {popover}
    </div>
  );
}
