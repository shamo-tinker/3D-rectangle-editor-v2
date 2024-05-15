export const RAD2ANG = (rad: number) => (rad * 180) / Math.PI;

export const ANG2RAD = (ang: number) => (ang * Math.PI) / 180;

export const GET_RANDOM_VAL = (range: number) =>
  Math.ceil(Math.random() * 100000000) % range;

export const GET_RANDOM_VAL_BETWEEN = (num1: number, num2: number) => {
  return num1 + Math.random() * (num2 - num1);
};

// export const getTwoCenterPoints = (vec1: Vector3, vec2: Vector3) => {
//   const offsetX = (vec1.x - vec2.x) / 3;
//   const offsetY = (vec1.y - vec2.y) / 3;
//   const offsetZ = (vec1.x - vec2.z) / 3;

//   const firstPos = new Vector3(
//     vec2.x + offsetX,
//     vec2.y + offsetY,
//     vec2.z + offsetZ
//   );

//   const secPos = new Vector3(
//     vec1.x - offsetX,
//     vec1.y - offsetY,
//     vec1.z - offsetZ
//   );

//   return [firstPos, secPos];
// };
