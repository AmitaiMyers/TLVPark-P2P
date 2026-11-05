/**
 * English dictionary. Its shape is the source of truth for `Dictionary`:
 * every other locale must provide exactly the same keys.
 */
export const en = {
  meta: {
    appName: "TLVPark",
    description: "Rent private parking spots in Tel Aviv by the hour or day.",
  },
  home: {
    tagline: "Stop circling the block. Park in a neighbor's spot.",
    findSpot: "Find parking",
    listSpot: "List your spot",
  },
  language: {
    switchTo: "עברית",
  },
};

export type Dictionary = typeof en;
