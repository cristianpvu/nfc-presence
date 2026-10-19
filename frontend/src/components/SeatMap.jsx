const DESK_WIDTH = 64;
const DESK_HEIGHT = 40;
const GAP = 10;
const PADDING = 16;
const BOARD_HEIGHT = 32;

export default function SeatMap({ desks, occupants }) {
  if (desks.length === 0) return <p className="muted">Sala nu are bănci configurate.</p>;

  const cols = Math.max(...desks.map(desk => desk.col));
  const rows = Math.max(...desks.map(desk => desk.row));
  const boardTop = PADDING + rows * DESK_HEIGHT + (rows - 1) * GAP + GAP * 3;
  const width = PADDING * 2 + cols * DESK_WIDTH + (cols - 1) * GAP;
  const height = boardTop + BOARD_HEIGHT + PADDING;

  return (
    <svg className="seat-map" viewBox={`0 0 ${width} ${height}`} style={{ maxWidth: width }} role="img" aria-label="Plan sală">
      <rect className="board" x={PADDING} y={boardTop} width={width - PADDING * 2} height={BOARD_HEIGHT} rx="4" />
      <text className="board-label" x={width / 2} y={boardTop + BOARD_HEIGHT / 2}>Catedră</text>
      {desks.map(desk => {
        const name = occupants.get(desk._id);
        const x = PADDING + (desk.col - 1) * (DESK_WIDTH + GAP);
        const y = PADDING + (rows - desk.row) * (DESK_HEIGHT + GAP);
        return (
          <g key={desk._id} className={name ? 'desk taken' : 'desk'}>
            <title>{name ? `${desk.label}: ${name}` : desk.label}</title>
            <rect x={x} y={y} width={DESK_WIDTH} height={DESK_HEIGHT} rx="4" />
            <text x={x + DESK_WIDTH / 2} y={y + DESK_HEIGHT / 2}>{desk.label}</text>
          </g>
        );
      })}
    </svg>
  );
}
