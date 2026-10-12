import { useCallback, useEffect, useRef, useState } from "react";

export const wrapIndex = (index: number, length: number) =>
  length ? ((index % length) + length) % length : 0;

export function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () =>
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches || false,
  );
  useEffect(() => {
    const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!query) return;
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

export type OrbitMotion = {
  position: number;
  velocity: number;
  sway: number;
  swayVelocity: number;
};

// A critically damped orbit carries an underdamped pendulum. Acceleration excites
// the pendulum, so it keeps swinging after the carousel reaches its destination.
export function advanceOrbitMotion(
  state: OrbitMotion,
  target: number,
  dt: number,
  dragging = false,
): OrbitMotion {
  // Small substeps keep the feel consistent on 30, 60 and 120 Hz displays.
  const steps = Math.max(1, Math.ceil(dt * 120));
  dt /= steps;
  for (let step = 0; step < steps; step++) {
    const acceleration = dragging
      ? 0
      : (target - state.position) * 88 - state.velocity * 18;
    const velocity = dragging
      ? state.velocity
      : state.velocity + acceleration * dt;
    const swayVelocity =
      state.swayVelocity +
      (-acceleration * 18 - state.sway * 56 - state.swayVelocity * 4.6) * dt;
    state = {
      position: dragging ? state.position : state.position + velocity * dt,
      velocity,
      sway: Math.max(-24, Math.min(24, state.sway + swayVelocity * dt)),
      swayVelocity,
    };
  }
  return state;
}

export function useOrbitSpring(reduced: boolean) {
  const initial: OrbitMotion = {
    position: 0,
    velocity: 0,
    sway: 0,
    swayVelocity: 0,
  };
  const [motion, setMotion] = useState(initial);
  const state = useRef(initial);
  const current = useRef(0);
  const target = useRef(0);
  const dragging = useRef(false);
  const lastDrag = useRef(0);
  const frame = useRef(0);
  const lastTime = useRef(0);
  const stop = useCallback(() => {
    cancelAnimationFrame(frame.current);
    frame.current = 0;
  }, []);
  useEffect(() => stop, [stop]);
  const jumpTo = useCallback(
    (value: number) => {
      stop();
      dragging.current = false;
      current.current = target.current = value;
      state.current = {
        position: value,
        velocity: 0,
        sway: 0,
        swayVelocity: 0,
      };
      setMotion(state.current);
    },
    [stop],
  );
  const start = useCallback(() => {
    if (frame.current) return;
    lastTime.current = performance.now();
    const tick = (time: number) => {
      const dt = Math.min((time - lastTime.current) / 1000, 1 / 30);
      lastTime.current = time;
      state.current = advanceOrbitMotion(
        state.current,
        target.current,
        dt,
        dragging.current,
      );
      current.current = state.current.position;
      if (
        !dragging.current &&
        Math.abs(target.current - current.current) < 0.0005 &&
        Math.abs(state.current.velocity) < 0.001 &&
        Math.abs(state.current.sway) < 0.015 &&
        Math.abs(state.current.swayVelocity) < 0.025
      ) {
        current.current = target.current;
        state.current = {
          position: target.current,
          velocity: 0,
          sway: 0,
          swayVelocity: 0,
        };
        frame.current = 0;
      } else frame.current = requestAnimationFrame(tick);
      setMotion(state.current);
    };
    frame.current = requestAnimationFrame(tick);
  }, []);
  const animateTo = useCallback(
    (value: number) => {
      target.current = value;
      const wasDragging = dragging.current;
      dragging.current = false;
      // A held pointer should not release with a stale flick velocity.
      if (wasDragging && performance.now() - lastDrag.current > 100)
        state.current.velocity = 0;
      if (reduced) jumpTo(value);
      else start();
    },
    [jumpTo, reduced, start],
  );
  const dragTo = useCallback(
    (value: number) => {
      if (reduced) {
        jumpTo(value);
        return;
      }
      const now = performance.now();
      const dt = Math.max(
        1 / 120,
        Math.min((now - lastDrag.current) / 1000, 1 / 20),
      );
      const velocity = Math.max(
        -9,
        Math.min(9, (value - current.current) / dt),
      );
      state.current = {
        ...state.current,
        position: value,
        velocity,
        swayVelocity: Math.max(
          -180,
          Math.min(
            180,
            state.current.swayVelocity -
              (velocity - state.current.velocity) * 4,
          ),
        ),
      };
      dragging.current = true;
      lastDrag.current = now;
      current.current = target.current = value;
      setMotion(state.current);
      start();
    },
    [jumpTo, reduced, start],
  );
  useEffect(() => {
    if (reduced) jumpTo(target.current);
  }, [reduced, jumpTo]);
  return {
    position: motion.position,
    sway: motion.sway,
    current,
    target,
    dragTo,
    animateTo,
  };
}
