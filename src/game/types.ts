export type Direction = "up" | "down" | "left" | "right";

export interface Point {
  x: number;
  y: number;
}
export interface Bounds extends Point {
  width: number;
  height: number;
}

export interface Story {
  id: string;
  title: string;
  kind: "memory" | "dialogue" | "intro" | "collection";
  speaker: string;
  paragraphs: string[];
}

export interface Furniture extends Bounds {
  id: string;
  kind:
    | "sofa"
    | "desk"
    | "shelf"
    | "plant"
    | "npc"
    | "door"
    | "fridge"
    | "counter"
    | "table";
  interaction?: { label: string; action: InteractionAction; point: Point };
}

export type InteractionAction =
  | { type: "story"; storyId: string }
  | { type: "travel"; roomId: string; spawnId: string };

export interface RoomDefinition {
  id: string;
  name: string;
  theme: "living" | "kitchen";
  hint: string;
  width: number;
  height: number;
  walkable: Bounds;
  spawn: Point;
  entrances: Record<string, Point>;
  furniture: Furniture[];
}

/** Shared input and callbacks keep the renderer independent of React components. */
export interface GameBridge {
  paused: boolean;
  direction: Direction | null;
  interactRequested: boolean;
  onReady: () => void;
  onNearby: (label: string | null) => void;
  onStory: (storyId: string) => void;
  onRoom: (roomId: string) => void;
}
