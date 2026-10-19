import { useEffect, useRef, useState } from 'react';
import { formatTime } from '../format';

const DESK_WIDTH = 64;
const DESK_HEIGHT = 40;
const GAP = 10;
const PADDING = 16;
const BOARD_HEIGHT = 32;

export default function SeatMap({ desks, occupants }) {
  const [selectedId, setSelectedId] = useState(null);
  const popoverRef = useRef(null);

  useEffect(() => {
    if (!selectedId) return;
    const close = event => {
      if (popoverRef.current?.contains(event.target) || event.target.closest('.desk.taken')) return;
      setSelectedId(null);
    };
    const closeOnEscape = event => event.key === 'Escape' && setSelectedId(null);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [selectedId]);

  if (desks.length === 0) return <p className="muted">Sala nu are bănci configurate.</p>;

  const cols = Math.max(...desks.map(desk => desk.col));
  const rows = Math.max(...desks.map(desk => desk.row));
  const boardTop = PADDING + rows * DESK_HEIGHT + (rows - 1) * GAP + GAP * 3;
  const width = PADDING * 2 + cols * DESK_WIDTH + (cols - 1) * GAP;
  const height = boardTop + BOARD_HEIGHT + PADDING;

  const position = desk => ({
    x: PADDING + (desk.col - 1) * (DESK_WIDTH + GAP),
    y: PADDING + (rows - desk.row) * (DESK_HEIGHT + GAP),
  });

  const toggle = desk => setSelectedId(current => (current === desk._id ? null : desk._id));

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
        <div className="seat-popover-time">{formatTime(selected.createdAt)}</div>
      </div>
    );
  }

  return (
    <div className="seat-map-wrap" style={{ maxWidth: width }}>
      <svg className="seat-map" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Plan sală">
        <rect className="board" x={PADDING} y={boardTop} width={width - PADDING * 2} height={BOARD_HEIGHT} rx="4" />
        <text className="board-label" x={width / 2} y={boardTop + BOARD_HEIGHT / 2}>Catedră</text>
        {desks.map(desk => {
          const taken = occupants.has(desk._id);
          const { x, y } = position(desk);
          const classes = ['desk', taken && 'taken', desk._id === selectedId && 'selected'].filter(Boolean).join(' ');
          return (
            <g
              key={desk._id}
              className={classes}
              onClick={() => taken && toggle(desk)}
              onKeyDown={event => taken && event.key === 'Enter' && toggle(desk)}
              tabIndex={taken ? 0 : undefined}
              role={taken ? 'button' : undefined}
            >
              <title>{desk.label}</title>
              <rect x={x} y={y} width={DESK_WIDTH} height={DESK_HEIGHT} rx="4" />
              <text x={x + DESK_WIDTH / 2} y={y + DESK_HEIGHT / 2}>{desk.label}</text>
            </g>
          );
        })}
      </svg>
      {popover}
    </div>
  );
}
