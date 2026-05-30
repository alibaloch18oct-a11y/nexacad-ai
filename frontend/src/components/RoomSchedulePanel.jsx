import React, { useMemo } from "react";
import { Table2, LocateFixed } from "lucide-react";

function roomArea(room, scale) {
  const width = Math.round(room.width / scale);
  const height = Math.round(room.height / scale);

  return {
    width,
    height,
    area: width * height
  };
}

export default function RoomSchedulePanel({
  plan,
  activeFloor,
  selected,
  setSelected,
  setActiveFloor
}) {
  const data = useMemo(() => {
    if (!plan) {
      return {
        rooms: [],
        totalArea: 0,
        allFloors: []
      };
    }

    const scale = plan.scale || 12;
    const rooms = (plan.rooms || []).filter((room) => room.floor === activeFloor);

    const rows = rooms.map((room) => ({
      ...room,
      calc: roomArea(room, scale)
    }));

    const totalArea = rows.reduce((sum, room) => sum + room.calc.area, 0);

    const floorCount = plan.floors || 1;
    const allFloors = Array.from({ length: floorCount }).map((_, floor) => {
      const floorRooms = (plan.rooms || []).filter((room) => room.floor === floor);
      const floorArea = floorRooms.reduce((sum, room) => {
        return sum + roomArea(room, scale).area;
      }, 0);

      return {
        floor,
        count: floorRooms.length,
        area: floorArea
      };
    });

    return {
      rooms: rows,
      totalArea,
      allFloors
    };
  }, [plan, activeFloor]);

  if (!plan) {
    return (
      <section className="room-schedule-panel">
        <div className="panel-heading">
          <Table2 size={18} />
          <span>Room Schedule</span>
        </div>
        <p className="muted">Generate a plan to see room schedule.</p>
      </section>
    );
  }

  return (
    <section className="room-schedule-panel">
      <div className="panel-heading">
        <Table2 size={18} />
        <span>Room Schedule</span>
      </div>

      <div className="floor-summary-grid">
        {data.allFloors.map((floor) => (
          <button
            key={floor.floor}
            className={activeFloor === floor.floor ? "active" : ""}
            onClick={() => setActiveFloor(floor.floor)}
          >
            <strong>{floor.floor === 0 ? "Ground" : `Floor ${floor.floor}`}</strong>
            <span>{floor.count} rooms</span>
            <small>{floor.area} sq ft</small>
          </button>
        ))}
      </div>

      <div className="room-schedule-table">
        <div className="room-schedule-head">
          <span>Room</span>
          <span>Size</span>
          <span>Area</span>
          <span></span>
        </div>

        {data.rooms.length === 0 ? (
          <p className="muted schedule-empty">No rooms on this floor.</p>
        ) : (
          data.rooms.map((room) => {
            const active = selected?.type === "room" && selected?.id === room.id;

            return (
              <button
                key={room.id}
                className={active ? "room-row active" : "room-row"}
                onClick={() => setSelected({ type: "room", id: room.id })}
              >
                <span>
                  <strong>{room.name}</strong>
                  <small>{room.type}</small>
                </span>

                <span>
                  {room.calc.width}' x {room.calc.height}'
                </span>

                <span>{room.calc.area} sq ft</span>

                <LocateFixed size={14} />
              </button>
            );
          })
        )}
      </div>

      <div className="schedule-total">
        <span>Current Floor Area</span>
        <strong>{data.totalArea} sq ft</strong>
      </div>
    </section>
  );
}