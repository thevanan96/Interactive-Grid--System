"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

type AbsRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Box = {
  id: number;
  col: number;
  row: number;
  colSpan: number;
  rowSpan: number;
  isSelected: boolean;
  abs?: AbsRect;
};

type DragState =
  | null
  | {
      boxId: number;
      type: "move" | "resize";
      startX: number;
      startY: number;
      startAbs: AbsRect;
    };

const COL_COUNT = 10;
const SNAP_ROW_HEIGHT = 80;

export default function GridPage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);
  const [boxes, setBoxes] = useState<Box[]>(() => [
    { id: 1, col: 1, row: 1, colSpan: 3, rowSpan: 2, isSelected: false },
    { id: 2, col: 4, row: 1, colSpan: 2, rowSpan: 1, isSelected: false },
    { id: 3, col: 7, row: 2, colSpan: 4, rowSpan: 2, isSelected: false },
  ]);
  const [dragState, setDragState] = useState<DragState>(null);

  useLayoutEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setContainerRect(containerRef.current.getBoundingClientRect());
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const colWidth = containerRect ? containerRect.width / COL_COUNT : 0;

  // ============== DRAG HANDLING =====================
  useEffect(() => {
    function handleMove(e: MouseEvent) {
      if (!dragState) return;

      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;

      setBoxes((prev) =>
        prev.map((b) => {
          if (b.id !== dragState.boxId || !b.abs) return b;

          if (dragState.type === "move") {
            return {
              ...b,
              abs: {
                ...b.abs,
                x: dragState.startAbs.x + dx,
                y: dragState.startAbs.y + dy,
              },
            };
          }

          return {
            ...b,
            abs: {
              ...b.abs,
              width: Math.max(40, dragState.startAbs.width + dx),
              height: Math.max(40, dragState.startAbs.height + dy),
            },
          };
        })
      );
    }

    function handleUp() {
      setDragState(null);
    }

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [dragState]);

  // ================= SELECT BOX ======================
  function handleSelectBox(id: number) {
    if (!containerRef.current) return;

    const container = containerRef.current.getBoundingClientRect();

    setBoxes((prev) =>
      prev.map((box) => {
        if (box.id !== id) return { ...box, isSelected: false, abs: undefined };

        const element = document.getElementById(`box-${id}`);
        if (!element) return box;

        const rect = element.getBoundingClientRect();

        const abs: AbsRect = {
          x: rect.left - container.left,
          y: rect.top - container.top,
          width: rect.width,
          height: rect.height,
        };

        return { ...box, isSelected: true, abs };
      })
    );
  }

  // ============= SNAP BACK TO GRID ===================
  function snapSelectedToGrid() {
    if (!containerRect || colWidth === 0) return;

    setBoxes((prev) =>
      prev.map((b) => {
        if (!b.isSelected || !b.abs)
          return { ...b, isSelected: false, abs: undefined };

        const { x, y, width, height } = b.abs;

        let col = Math.round(x / colWidth) + 1;
        let colSpan = Math.max(1, Math.round(width / colWidth));

        col = Math.max(1, Math.min(COL_COUNT, col));
        colSpan = Math.max(1, Math.min(COL_COUNT - col + 1, colSpan));

        let row = Math.round(y / SNAP_ROW_HEIGHT) + 1;
        let rowSpan = Math.max(1, Math.round(height / SNAP_ROW_HEIGHT));

        return {
          ...b,
          col,
          row: Math.max(1, row),
          colSpan,
          rowSpan,
          isSelected: false,
          abs: undefined,
        };
      })
    );
  }

  // =============== CLICK OUTSIDE =====================
  function handleContainerClick(e: React.MouseEvent<HTMLDivElement>) {
    const isBox = (e.target as HTMLElement).closest(".box-item");
    if (!isBox) {
      snapSelectedToGrid();
    }
  }

  // ====================================================
  return (
    <main className="min-h-screen bg-slate-200 flex flex-col items-center p-6">
      <h1 className="text-2xl font-bold mb-4 text-gray-900">
        Interactive Grid System (10 Columns)
      </h1>

      <button
        onClick={snapSelectedToGrid}
        className="px-4 py-2 bg-blue-600 text-white rounded mb-4"
      >
        Snap selected boxes to grid
      </button>

      <div
        ref={containerRef}
        className="relative w-full max-w-5xl h-[600px] bg-white border border-gray-300 rounded-xl p-3"
        onMouseDown={handleContainerClick}
      >
        {/* GRID (UNSELECTED BOXES) */}
        <div
          className="grid gap-2 h-full"
          style={{
            gridTemplateColumns: `repeat(${COL_COUNT}, minmax(0, 1fr))`,
            gridAutoRows: `minmax(${SNAP_ROW_HEIGHT}px, auto)`,
          }}
        >
          {boxes
            .filter((b) => !b.isSelected)
            .map((b) => (
              <div
                key={b.id}
                id={`box-${b.id}`}
                className="box-item bg-gray-200 border border-gray-500 rounded flex items-center justify-center text-sm cursor-pointer text-black"
                style={{
                  gridColumn: `${b.col} / span ${b.colSpan}`,
                  gridRow: `${b.row} /span ${b.rowSpan}`,
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  handleSelectBox(b.id);
                }}
              >
                Box {b.id}
              </div>
            ))}
        </div>

        {/* SELECTED BOXES (ABSOLUTE MODE) */}
        {boxes
          .filter((b) => b.isSelected && b.abs)
          .map((b) => {
            const abs = b.abs!;
            return (
              <div
                key={b.id}
                className="box-item absolute bg-blue-100 border border-blue-600 rounded shadow cursor-move text-black"
                style={{
                  left: abs.x,
                  top: abs.y,
                  width: abs.width,
                  height: abs.height,
                }}
                onMouseDown={(e) => handleStartMove(e, b.id)}
              >
                <div className="text-xs font-bold p-1 text-black">
                  Box {b.id} (selected)
                </div>

                <div
                  className="absolute w-3 h-3 right-1 bottom-1 bg-white border border-blue-700 cursor-se-resize"
                  onMouseDown={(e) => handleStartResize(e, b.id)}
                />
              </div>
            );
          })}
      </div>
    </main>
  );

  // ===== MOVE AND RESIZE HELPERS =====================
  function handleStartMove(
    e: React.MouseEvent<HTMLDivElement>,
    boxId: number
  ) {
    e.stopPropagation();
    const box = boxes.find((b) => b.id === boxId);
    if (!box || !box.abs) return;

    setDragState({
      boxId,
      type: "move",
      startX: e.clientX,
      startY: e.clientY,
      startAbs: box.abs,
    });
  }

  function handleStartResize(
    e: React.MouseEvent<HTMLDivElement>,
    boxId: number
  ) {
    e.stopPropagation();
    const box = boxes.find((b) => b.id === boxId);
    if (!box || !box.abs) return;

    setDragState({
      boxId,
      type: "resize",
      startX: e.clientX,
      startY: e.clientY,
      startAbs: box.abs,
    });
  }
}
