"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from "d3-force";
import gsap from "gsap";

export interface GraphNode {
  id: string;
  type: "person" | "memory" | "journal" | "event" | "place";
  label: string;
  href: string;
  isSelf?: boolean;
  avatarUrl?: string;
  isLocked?: boolean;
}

export interface GraphEdge {
  source: string;
  target: string;
  kind: "relationship" | "appearance" | "archived" | "location" | "inferred";
  label?: string;
}

const NODE_TYPE_LABEL: Record<GraphNode["type"], string> = {
  person: "Person",
  memory: "Memory",
  journal: "Journal entry",
  event: "Event",
  place: "Place",
};

const NODE_CLASS: Record<GraphNode["type"], string> = {
  person: "node-person",
  memory: "node-memory",
  journal: "node-journal",
  event: "node-event",
  place: "node-place",
};

const EDGE_DESCRIPTION: Record<GraphEdge["kind"], string> = {
  relationship: "Relationship",
  appearance: "Was there",
  archived: "In your archive",
  location: "Happened here",
  inferred: "Same day",
};

interface SimNode extends GraphNode {
  x: number;
  y: number;
  fx?: number;
  fy?: number;
}

const WIDTH = 900;
const HEIGHT = 560;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 5;

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

export function ConnectionsGraph({ nodes, edges }: { nodes: GraphNode[]; edges: GraphEdge[] }) {
  const router = useRouter();

  const laidOut = useMemo(() => {
    const simNodes: SimNode[] = nodes.map((n) => ({
      ...n,
      x: 0,
      y: 0,
      // The self node is anchored dead-center — everything else settles
      // around it instead of the graph finding its own arbitrary center.
      ...(n.isSelf ? { fx: WIDTH / 2, fy: HEIGHT / 2 } : {}),
    }));
    const simLinks = edges.map((e) => ({ ...e }));

    const LINK_DISTANCE: Record<GraphEdge["kind"], number> = {
      relationship: 90,
      archived: 130,
      appearance: 70,
      location: 55,
      inferred: 45,
    };
    const COLLIDE_RADIUS: Record<GraphNode["type"], number> = {
      person: 34,
      place: 26,
      memory: 20,
      journal: 20,
      event: 20,
    };

    const sim = forceSimulation(simNodes as never[])
      .force(
        "link",
        forceLink(simLinks as never[])
          .id((d) => (d as unknown as GraphNode).id)
          .distance((l) => LINK_DISTANCE[(l as unknown as GraphEdge).kind])
      )
      .force("charge", forceManyBody().strength(-180))
      .force("center", forceCenter(WIDTH / 2, HEIGHT / 2))
      .force(
        "collide",
        forceCollide((d) => COLLIDE_RADIUS[(d as unknown as GraphNode).type])
      )
      .stop();

    for (let i = 0; i < 300; i++) sim.tick();

    return simNodes;
  }, [nodes, edges]);

  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>(() =>
    Object.fromEntries(laidOut.map((n) => [n.id, { x: WIDTH / 2, y: HEIGHT / 2 }]))
  );
  // Pan/zoom of the whole graph — separate from `positions`, which is each
  // node's own place inside the fixed 900x560 layout space. The svg element
  // itself never resizes; a wrapping <g> is translated/scaled instead, so
  // node-drag math (toSvgPoint) has to invert that transform to land drags
  // at the right logical position regardless of current zoom.
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragId = useRef<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const panState = useRef<{ x: number; y: number } | null>(null);
  const pinchDist = useRef<number | null>(null);

  // Nodes settle into their force-simulated layout from the graph's center —
  // orchestrated with GSAP rather than Framer Motion since every node moves
  // through the same shared timeline instead of independently.
  useEffect(() => {
    const start = Object.fromEntries(laidOut.map((n) => [n.id, { x: WIDTH / 2, y: HEIGHT / 2 }]));
    const end = Object.fromEntries(laidOut.map((n) => [n.id, { x: n.x, y: n.y }]));
    const proxy = { t: 0 };

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const tween = gsap.to(proxy, {
      t: 1,
      duration: reduceMotion ? 0 : 0.9,
      ease: "power3.out",
      onUpdate: () => {
        const next: Record<string, { x: number; y: number }> = {};
        for (const id of Object.keys(end)) {
          next[id] = {
            x: start[id].x + (end[id].x - start[id].x) * proxy.t,
            y: start[id].y + (end[id].y - start[id].y) * proxy.t,
          };
        }
        setPositions(next);
      },
    });

    return () => {
      tween.kill();
    };
  }, [laidOut]);

  // Wheel/trackpad zoom needs a real (non-passive) listener to call
  // preventDefault — React's onWheel prop is attached passively, so
  // preventDefault silently no-ops there and the page scrolls instead.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      zoomAt(e.clientX, e.clientY, factor);
    }

    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function zoomAt(clientX: number, clientY: number, factor: number) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const anchorX = ((clientX - rect.left) / rect.width) * WIDTH;
    const anchorY = ((clientY - rect.top) / rect.height) * HEIGHT;

    setZoom((prevZoom) => {
      const nextZoom = clamp(prevZoom * factor, MIN_ZOOM, MAX_ZOOM);
      setPan((prevPan) => {
        const localX = (anchorX - prevPan.x) / prevZoom;
        const localY = (anchorY - prevPan.y) / prevZoom;
        return { x: anchorX - localX * nextZoom, y: anchorY - localY * nextZoom };
      });
      return nextZoom;
    });
  }

  function resetView() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  // Converts a client point to the pre-transform 900x560 layout space
  // (i.e. inverts the current pan/zoom), so dragging a node lands it at
  // the right logical spot no matter how far the graph is currently
  // zoomed or panned.
  function toSvgPoint(clientX: number, clientY: number) {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const svgX = ((clientX - rect.left) / rect.width) * WIDTH;
    const svgY = ((clientY - rect.top) / rect.height) * HEIGHT;
    return { x: (svgX - pan.x) / zoom, y: (svgY - pan.y) / zoom };
  }

  function nodePos(id: string) {
    return positions[id] ?? { x: WIDTH / 2, y: HEIGHT / 2 };
  }

  const edgeClass: Record<GraphEdge["kind"], string> = {
    relationship: "connections-edge-strong",
    appearance: "connections-edge",
    archived: "connections-edge-faint",
    location: "connections-edge-location",
    inferred: "connections-edge-inferred",
  };

  const NODE_RADIUS: Record<GraphNode["type"], number> = {
    person: 20,
    place: 14,
    memory: 11,
    journal: 11,
    event: 11,
  };

  return (
    <div className="connections-canvas">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="connections-svg"
        onPointerDown={(e) => {
          pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          svgRef.current?.setPointerCapture(e.pointerId);
          if (pointers.current.size === 2) {
            panState.current = null;
            const pts = [...pointers.current.values()];
            pinchDist.current = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
          } else if (pointers.current.size === 1 && !dragId.current) {
            panState.current = { x: e.clientX, y: e.clientY };
          }
        }}
        onPointerMove={(e) => {
          if (!pointers.current.has(e.pointerId)) return;
          pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

          if (pointers.current.size >= 2) {
            const pts = [...pointers.current.values()];
            const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
            if (pinchDist.current) {
              zoomAt((pts[0].x + pts[1].x) / 2, (pts[0].y + pts[1].y) / 2, dist / pinchDist.current);
            }
            pinchDist.current = dist;
            return;
          }

          if (dragId.current) {
            const p = toSvgPoint(e.clientX, e.clientY);
            setPositions((prev) => ({ ...prev, [dragId.current as string]: p }));
            return;
          }

          if (panState.current) {
            const svg = svgRef.current;
            if (!svg) return;
            const rect = svg.getBoundingClientRect();
            const dx = ((e.clientX - panState.current.x) / rect.width) * WIDTH;
            const dy = ((e.clientY - panState.current.y) / rect.height) * HEIGHT;
            setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
            panState.current = { x: e.clientX, y: e.clientY };
          }
        }}
        onPointerUp={(e) => {
          pointers.current.delete(e.pointerId);
          if (pointers.current.size < 2) pinchDist.current = null;
          dragId.current = null;
          panState.current = null;
        }}
        onPointerLeave={(e) => {
          pointers.current.delete(e.pointerId);
          if (pointers.current.size < 2) pinchDist.current = null;
          dragId.current = null;
          panState.current = null;
        }}
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          <g className="connections-edges">
            {edges.map((e, i) => {
              const a = nodePos(e.source);
              const b = nodePos(e.target);
              return (
                <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={edgeClass[e.kind]}>
                  <title>{e.label ?? EDGE_DESCRIPTION[e.kind]}</title>
                </line>
              );
            })}
          </g>
          <g>
            {laidOut.map((n) => {
              const p = nodePos(n.id);
              const r = n.isSelf ? 28 : NODE_RADIUS[n.type];
              return (
                <g
                  key={n.id}
                  transform={`translate(${p.x}, ${p.y})`}
                  className="connections-node"
                  role="button"
                  tabIndex={0}
                  aria-label={n.isSelf ? "You" : `${NODE_TYPE_LABEL[n.type]}: ${n.label}`}
                  onPointerDown={() => {
                    if (!n.isSelf) dragId.current = n.id;
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(n.href);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(n.href);
                    }
                  }}
                >
                  {n.isSelf && <circle r={r + 6} className="node-self-ring" />}
                  {/* Category color (node-self / node-person / ...) always
                      comes from this base circle, untouched by whatever
                      renders on top of it — avatar, initial, or lock. */}
                  <circle r={r} className={n.isSelf ? "node-self" : NODE_CLASS[n.type]} />
                  {n.type === "person" && n.isLocked ? (
                    <text textAnchor="middle" dominantBaseline="central" fontSize={r} aria-hidden="true">
                      🔒
                    </text>
                  ) : n.avatarUrl ? (
                    <>
                      <clipPath id={`avatar-clip-${n.id.replace(/[^a-zA-Z0-9_-]/g, "-")}`}>
                        <circle r={r - 2} />
                      </clipPath>
                      <image
                        href={n.avatarUrl}
                        x={-(r - 2)}
                        y={-(r - 2)}
                        width={(r - 2) * 2}
                        height={(r - 2) * 2}
                        preserveAspectRatio="xMidYMid slice"
                        clipPath={`url(#avatar-clip-${n.id.replace(/[^a-zA-Z0-9_-]/g, "-")})`}
                      />
                    </>
                  ) : n.type === "person" ? (
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={r * 0.9}
                      className="connections-initial"
                      aria-hidden="true"
                    >
                      {(n.isSelf ? "You" : n.label).charAt(0).toUpperCase()}
                    </text>
                  ) : null}
                  <text y={r + 14} textAnchor="middle" className="connections-label">
                    {n.isSelf ? "You" : n.label}
                  </text>
                </g>
              );
            })}
          </g>
        </g>
      </svg>

      <div className="connections-zoom-controls">
        <button
          type="button"
          aria-label="Zoom in"
          onClick={() => {
            const svg = svgRef.current;
            if (!svg) return;
            const rect = svg.getBoundingClientRect();
            zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 1.25);
          }}
        >
          +
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => {
            const svg = svgRef.current;
            if (!svg) return;
            const rect = svg.getBoundingClientRect();
            zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 1 / 1.25);
          }}
        >
          −
        </button>
        <button type="button" aria-label="Reset zoom" onClick={resetView}>
          Reset
        </button>
      </div>
    </div>
  );
}
