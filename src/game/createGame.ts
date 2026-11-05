import Phaser from "phaser";
import { rooms, stories } from "../content/world";
import { createCharacterTextures, drawRoom } from "./art";
import { movePlayer } from "./movement";
import { validateWorld } from "./validateWorld";
import type { Direction, Furniture, GameBridge, Point } from "./types";

class WorldScene extends Phaser.Scene {
  private room = rooms["living-room"];
  private position: Point = { ...this.room.spawn };
  private player!: Phaser.GameObjects.Image;
  private marker!: Phaser.GameObjects.Text;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private facing: Direction = "down";
  private nearest: Furniture | null = null;
  private nearbyLabel: string | null = null;

  constructor(private bridge: GameBridge) {
    super("world");
  }

  create(): void {
    createCharacterTextures(this);
    this.renderRoom();
    this.keys = this.input.keyboard!.addKeys(
      "W,A,S,D,UP,DOWN,LEFT,RIGHT,E,SPACE",
    ) as typeof this.keys;
    // Queue short taps, including ones released between render frames.
    this.input.keyboard!.on("keydown", (event: KeyboardEvent) => {
      if (
        !event.repeat &&
        !this.bridge.paused &&
        (event.code === "KeyE" || event.code === "Space")
      ) {
        this.bridge.interactRequested = true;
      }
    });
    this.game.canvas.setAttribute("role", "img");
    this.bridge.onReady();
  }

  private renderRoom(): void {
    // One persistent scene owns input; only room display objects are replaced.
    this.children.removeAll(true);
    drawRoom(this, this.room);
    for (const item of this.room.furniture.filter(
      (furniture) => furniture.kind === "npc",
    )) {
      this.add
        .image(item.x + 8, item.y + 12, "companion-down-0")
        .setScale(2)
        .setDepth(2);
    }
    this.player = this.add
      .image(this.position.x, this.position.y - 8, "player-down-0")
      .setScale(2)
      .setDepth(2);
    this.marker = this.add
      .text(0, 0, "◇", {
        fontSize: "18px",
        color: "#fff2b8",
        fontFamily: "monospace",
      })
      .setOrigin(0.5)
      .setDepth(3)
      .setVisible(false);
    this.game.canvas.setAttribute(
      "aria-label",
      `像素${this.room.name}，使用方向键移动，靠近物件后按 E 互动`,
    );
    this.nearest = null;
    this.nearbyLabel = null;
    this.bridge.onNearby(null);
    this.bridge.onRoom(this.room.id);
  }

  update(time: number, delta: number): void {
    const requested = this.bridge.interactRequested;
    this.bridge.interactRequested = false;
    const paused =
      this.bridge.paused || document.hidden || !document.hasFocus();
    // Let native dialogs own Space, arrows and keyboard navigation while reading.
    this.input.keyboard!.manager.preventDefault = !paused;
    if (paused) {
      this.input.keyboard?.resetKeys();
      return;
    }
    const direction = this.getDirection();
    const previous = this.position;
    if (direction) {
      this.facing = direction;
      this.position = movePlayer(
        this.position,
        {
          x: direction === "left" ? -90 : direction === "right" ? 90 : 0,
          y: direction === "up" ? -90 : direction === "down" ? 90 : 0,
        },
        Math.min(delta, 50) / 1000,
        this.room,
      );
    }
    const moved =
      previous.x !== this.position.x || previous.y !== this.position.y;
    const frame = moved ? 1 + (Math.floor(time / 170) % 2) : 0;
    this.player.setTexture(`player-${this.facing}-${frame}`);
    this.player.setPosition(
      Math.round(this.position.x),
      Math.round(this.position.y) - 8,
    );
    this.updateNearby();
    const action = this.nearest?.interaction?.action;
    if (!requested || !action) return;
    if (action.type === "story") {
      this.bridge.onStory(action.storyId);
      return;
    }
    this.room = rooms[action.roomId];
    this.position = { ...this.room.entrances[action.spawnId] };
    this.facing = "down";
    this.bridge.direction = null;
    this.input.keyboard?.resetKeys();
    this.renderRoom();
  }

  private getDirection(): Direction | null {
    if (this.bridge.direction) return this.bridge.direction;
    if (this.keys.UP.isDown || this.keys.W.isDown) return "up";
    if (this.keys.DOWN.isDown || this.keys.S.isDown) return "down";
    if (this.keys.LEFT.isDown || this.keys.A.isDown) return "left";
    if (this.keys.RIGHT.isDown || this.keys.D.isDown) return "right";
    return null;
  }

  private updateNearby(): void {
    this.nearest =
      this.room.furniture
        .filter((item) => item.interaction)
        .map((item) => ({
          item,
          distance: Phaser.Math.Distance.Between(
            this.position.x,
            this.position.y,
            item.interaction!.point.x,
            item.interaction!.point.y,
          ),
        }))
        .filter((candidate) => candidate.distance < 43)
        .sort((first, second) => first.distance - second.distance)[0]?.item ??
      null;
    const label = this.nearest?.interaction?.label ?? null;
    if (label !== this.nearbyLabel) {
      this.nearbyLabel = label;
      this.bridge.onNearby(label);
    }
    this.marker.setVisible(Boolean(this.nearest));
    if (this.nearest)
      this.marker.setPosition(
        this.nearest.x + this.nearest.width / 2,
        this.nearest.y - 13,
      );
  }
}

/** The host owns renderer lifetime; room changes reuse the renderer and keyboard. */
export function createGame(
  parent: HTMLElement,
  bridge: GameBridge,
): Phaser.Game {
  validateWorld(rooms, stories);
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 480,
    height: 320,
    backgroundColor: "#263c47",
    pixelArt: true,
    roundPixels: true,
    render: { antialias: false },
    input: { keyboard: { capture: [32, 37, 38, 39, 40] } },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [new WorldScene(bridge)],
  });
}
