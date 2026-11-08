export type Direction = "up" | "down" | "left" | "right";

export interface Point {
  x: number;
  y: number;
}
export interface Bounds extends Point {
  width: number;
  height: number;
}

export type ArtworkId = "monet-water-lilies" | "van-gogh-bedroom";

export type CollectionKind = "diary" | "words" | "album";

export interface Story {
  id: string;
  title: string;
  kind:
    | "memory"
    | "dialogue"
    | "intro"
    | "collection"
    | "dessert"
    | "gallery"
    | "album"
    | "milestone";
  speaker: string;
  paragraphs: string[];
  artworkId?: ArtworkId;
  photos?: { url: string; caption: string }[];
  note?: string;
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
    | "table"
    | "bed"
    | "painting"
    | "photo-board"
    | "achievement-wall";
  solid?: boolean;
  artworkId?: ArtworkId;
  doorSide?: "left" | "right" | "bottom";
  interaction?: {
    label: string;
    action: InteractionAction;
    /** Wall decorations project their reachable area onto the floor below. */
    area?: Bounds;
    range?: number;
  };
}

export type InteractionAction =
  | { type: "story"; storyId: string }
  | { type: "collection"; collection: CollectionKind }
  | { type: "achievements" }
  | { type: "travel"; roomId: string; spawnId: string };

export interface Staircase {
  id: string;
  direction: "up" | "down";
  entry: Point;
  exit: Point;
  destination: { roomId: string; spawnId: string };
}

export interface RoomDefinition {
  id: string;
  name: string;
  floor: -1 | 1 | 2;
  theme:
    "living" | "kitchen" | "bedroom" | "hallway" | "achievements" | "garden";
  hint: string;
  width: number;
  height: number;
  walkable: Bounds;
  spawn: Point;
  entrances: Record<string, Point>;
  furniture: Furniture[];
  stairs?: Staircase[];
}

/** Shared input and callbacks keep the renderer independent of React components. */
export interface GameBridge {
  paused: boolean;
  direction: Direction | null;
  interactRequested: boolean;
  onReady: () => void;
  onNearby: (label: string | null) => void;
  onStory: (storyId: string) => void;
  onCollection: (collection: CollectionKind) => void;
  onRoom: (roomId: string) => void;
  onTransition: (label: string | null) => void;
  onAchievements: () => void;
}
