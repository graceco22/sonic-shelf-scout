import React from "react";

type GroceryItem = {
  id: string;
  name: string;
  emoji: string;
  aisle: string;
  x: number;
  y: number;
};

interface StoreMapSVGProps {
  cartPosition: { x: number; y: number };
  targetItem: GroceryItem | undefined;
  items: GroceryItem[];
  collectedItems: string[];
  isMoving: boolean;
}

const StoreMapSVG: React.FC<StoreMapSVGProps> = ({
  cartPosition,
  targetItem,
  items,
  collectedItems,
  isMoving,
}) => {
  return (
    <svg viewBox="0 0 550 400" className="w-full h-auto rounded-2xl" style={{ background: "hsl(210, 100%, 97%)" }}>
      {/* Store Floor */}
      <rect x="10" y="10" width="530" height="380" rx="16" fill="hsl(210, 60%, 95%)" stroke="hsl(210, 30%, 90%)" strokeWidth="2" />

      {/* Aisles */}
      <rect x="140" y="60" width="40" height="280" rx="6" fill="hsl(210, 40%, 90%)" />
      <rect x="250" y="60" width="40" height="280" rx="6" fill="hsl(210, 40%, 90%)" />
      <rect x="360" y="60" width="40" height="280" rx="6" fill="hsl(210, 40%, 90%)" />

      {/* Aisle Labels */}
      <text x="160" y="52" textAnchor="middle" fontSize="10" fontWeight="bold" fill="hsl(220, 15%, 50%)">Aisle 1</text>
      <text x="270" y="52" textAnchor="middle" fontSize="10" fontWeight="bold" fill="hsl(220, 15%, 50%)">Aisle 2</text>
      <text x="380" y="52" textAnchor="middle" fontSize="10" fontWeight="bold" fill="hsl(220, 15%, 50%)">Aisle 3</text>

      {/* Section Labels */}
      <text x="70" y="370" textAnchor="middle" fontSize="11" fontWeight="bold" fill="hsl(220, 80%, 55%)">🥬 Produce</text>
      <text x="480" y="370" textAnchor="middle" fontSize="11" fontWeight="bold" fill="hsl(220, 80%, 55%)">🧊 Dairy</text>
      <text x="480" y="52" textAnchor="middle" fontSize="11" fontWeight="bold" fill="hsl(220, 80%, 55%)">🏪 Entrance</text>

      {/* Animated path to target */}
      {targetItem && !collectedItems.includes(targetItem.id) && (
        <line
          x1={cartPosition.x}
          y1={cartPosition.y}
          x2={targetItem.x}
          y2={targetItem.y}
          stroke="hsl(220, 80%, 55%)"
          strokeWidth="2.5"
          strokeDasharray="8 4"
          strokeLinecap="round"
          opacity="0.6"
        >
          <animate attributeName="stroke-dashoffset" from="24" to="0" dur="1s" repeatCount="indefinite" />
        </line>
      )}

      {/* Items */}
      {items.map((item) => {
        const isCollected = collectedItems.includes(item.id);
        const isCurrent = targetItem?.id === item.id && !isCollected;

        return (
          <g key={item.id}>
            {isCurrent && (
              <circle cx={item.x} cy={item.y} r="22" fill="none" stroke="hsl(220, 80%, 55%)" strokeWidth="2" opacity="0.4">
                <animate attributeName="r" values="22;30;22" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0;0.4" dur="1.5s" repeatCount="indefinite" />
              </circle>
            )}
            <circle
              cx={item.x}
              cy={item.y}
              r="18"
              fill={isCollected ? "hsl(220, 80%, 92%)" : isCurrent ? "hsl(220, 80%, 95%)" : "hsl(210, 40%, 94%)"}
              stroke={isCollected ? "hsl(220, 80%, 55%)" : isCurrent ? "hsl(220, 80%, 55%)" : "hsl(210, 30%, 85%)"}
              strokeWidth="2"
            />
            <text x={item.x} y={item.y + 5} textAnchor="middle" fontSize="16">
              {isCollected ? "✅" : item.emoji}
            </text>
          </g>
        );
      })}

      {/* Cart */}
      <g>
        <circle cx={cartPosition.x} cy={cartPosition.y} r="14" fill="hsl(340, 65%, 80%)" stroke="hsl(340, 65%, 60%)" strokeWidth="2">
          {isMoving && (
            <animate attributeName="r" values="14;16;14" dur="0.6s" repeatCount="indefinite" />
          )}
        </circle>
        <text x={cartPosition.x} y={cartPosition.y + 5} textAnchor="middle" fontSize="14">🐰</text>
      </g>
    </svg>
  );
};

export default StoreMapSVG;
