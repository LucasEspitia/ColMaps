// * Bounding box
// imaginary or geometric rectangle that completely
// encloses a geographic area within a coordinate system.
export type Bbox = readonly [
  west: number,
  south: number,
  east: number,
  north: number,
];
