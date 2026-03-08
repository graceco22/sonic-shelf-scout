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
    <svg viewBox="0 0 550 400" className="w-full h-auto rounded-xl" style={{ background: "hsl(220, 40%, 98%)" }}>
      {/* Store Floor */}
      <rect x="10" y="10" width="530" height="380" rx="14" fill="hsl(220, 30%, 96%)" stroke="hsl(220, 20%, 90%)" strokeWidth="1.5" />

      {/* Aisles */}
      <rect x="140" y="60" width="38" height="280" rx="8" fill="hsl(220, 25%, 92%)" />
      <rect x="250" y="60" width="38" height="280" rx="8" fill="hsl(220, 25%, 92%)" />
      <rect x="360" y="60" width="38" height="280" rx="8" fill="hsl(220, 25%, 92%)" />

      {/* Aisle Labels */}
      <text x="159" y="52" textAnchor="middle" fontSize="9" fontWeight="600" fill="hsl(220, 15%, 58%)" fontFamily="DM Sans, sans-serif">Aisle 1</text>
      <text x="269" y="52" textAnchor="middle" fontSize="9" fontWeight="600" fill="hsl(220, 15%, 58%)" fontFamily="DM Sans, sans-serif">Aisle 2</text>
      <text x="379" y="52" textAnchor="middle" fontSize="9" fontWeight="600" fill="hsl(220, 15%, 58%)" fontFamily="DM Sans, sans-serif">Aisle 3</text>

      {/* Section Labels */}
      <text x="70" y="370" textAnchor="middle" fontSize="10" fontWeight="600" fill="hsl(220, 50%, 50%)" fontFamily="DM Sans, sans-serif">🥬 Produce</text>
      <text x="480" y="370" textAnchor="middle" fontSize="10" fontWeight="600" fill="hsl(220, 50%, 50%)" fontFamily="DM Sans, sans-serif">🧊 Dairy</text>
      <text x="480" y="52" textAnchor="middle" fontSize="10" fontWeight="600" fill="hsl(220, 50%, 50%)" fontFamily="DM Sans, sans-serif">🏪 Entrance</text>

      {/* Animated path to target */}
      {targetItem && !collectedItems.includes(targetItem.id) && (
        <line
          x1={cartPosition.x}
          y1={cartPosition.y}
          x2={targetItem.x}
          y2={targetItem.y}
          stroke="hsl(220, 60%, 60%)"
          strokeWidth="2"
          strokeDasharray="6 4"
          strokeLinecap="round"
          opacity="0.5"
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
              <circle cx={item.x} cy={item.y} r="22" fill="none" stroke="hsl(220, 60%, 60%)" strokeWidth="1.5" opacity="0.4">
                <animate attributeName="r" values="22;28;22" dur="1.8s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0;0.4" dur="1.8s" repeatCount="indefinite" />
              </circle>
            )}
            <circle
              cx={item.x}
              cy={item.y}
              r="17"
              fill={isCollected ? "hsl(150, 40%, 92%)" : isCurrent ? "white" : "hsl(220, 20%, 95%)"}
              stroke={isCollected ? "hsl(150, 50%, 60%)" : isCurrent ? "hsl(220, 60%, 60%)" : "hsl(220, 15%, 88%)"}
              strokeWidth="1.5"
            />
            <text x={item.x} y={item.y + 5} textAnchor="middle" fontSize="16">
              {isCollected ? "✅" : item.emoji}
            </text>
          </g>
        );
      })}

      {/* Cart */}
      <g>
        <circle cx={cartPosition.x} cy={cartPosition.y} r="13" fill="hsl(340, 50%, 90%)" stroke="hsl(340, 50%, 70%)" strokeWidth="1.5">
          {isMoving && (
            <animate attributeName="r" values="13;15;13" dur="0.7s" repeatCount="indefinite" />
          )}
        </circle>
        <text x={cartPosition.x} y={cartPosition.y + 5} textAnchor="middle" fontSize="13">🐰</text>
      </g>
    </svg>
  );
};

export default StoreMapSVG;
