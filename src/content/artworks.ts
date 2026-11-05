import type { ArtworkId } from "../game/types";

const base = import.meta.env?.BASE_URL ?? "/";

export const artworks = [
  {
    id: "monet-water-lilies" satisfies ArtworkId,
    title: "睡莲",
    artist: "克劳德·莫奈",
    year: "1906",
    original: `${base}art/monet-original.webp`,
    pixel: `${base}art/monet-pixel.png`,
    note: "把一池安静的光，放进我们的小屋。",
    source:
      "https://commons.wikimedia.org/wiki/File:Claude_Monet_-_Water_Lilies_-_1906,_Ryerson.jpg",
  },
  {
    id: "van-gogh-bedroom" satisfies ArtworkId,
    title: "卧室",
    artist: "文森特·梵高",
    year: "1889",
    original: `${base}art/van-gogh-original.webp`,
    pixel: `${base}art/van-gogh-pixel.png`,
    note: "一张床、几把椅子，和让人安心回来的地方。",
    source:
      "https://commons.wikimedia.org/wiki/File:Vincent_van_Gogh_-_The_Bedroom_-_Google_Art_Project.jpg",
  },
];
