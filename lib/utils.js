export const distance = (x1, y1, x2, y2) => {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)
}

export const m = (x1, y1, x2, y2) => {
  return (y2 - y1) / (x2 - x1)
}

export const solveIx = (U, V, P, Q) => {
  const m1 = m(U[0], U[1], V[0], V[1])
  const m2 = m(P[0], P[1], Q[0], Q[1])
  // y - Vy = M1(x-Vx)
  // y - Py = M2(x - Px)
  // -Vy + Py = M1*x-M1*Vx -M2*x + M2*Px
  // -Vy + Py +M1*Vx - M2*Px = x(M1 - M2)
  if (m1 === m2) return undefined
  const x = (-V[1] + P[1] + m1 * V[0] - m2 * P[0]) / (m1 - m2)
  const y = m1 * (x - V[0]) + V[1]
  return [x, y]
}

export const solveIxM = (U, MU, V, MV) => {
  if (MU === MV) return undefined
  const U2 = [U[0] + 1, U[1] + MU]
  const V2 = [V[0] + 1, V[1] + MV]
  return solveIx(U, U2, V, V2)
}

export const midpoint = (U, V) => {
  return [(U[0] + V[0]) / 2, (U[1] + V[1]) / 2]
}
