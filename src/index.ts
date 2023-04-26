/**
 * Joystick for touch operation.
 *
 * @packageDocumentation
 */
import * as THREE from "three";

const angleRight = 0;
const angleForward = (-90 * Math.PI) / 180;
const angleLeft = (-180 * Math.PI) / 180;
const angleBack = (90 * Math.PI) / 180;
const diffLimit = (75 * Math.PI) / 180;
const DEFAULT_ROTATE_SPEED = (50 * Math.PI) / 180;
const DEFAULT_MOVE_SPEED = 2;
const DEFAULT_INTERVAL_SEC = 1 / 60; // 60fps

function diff(a: number, b: number) {
  if (a > b) {
    return a - b;
  } else {
    return b - a;
  }
}

export interface TouchControllerOptions {
  /**
   * Movement speed. Default is 2.
   */
  moveSpeed?: number;
  /**
   * Rotation speed. Default is (50 * Math.PI) / 180.
   */
  rotationSpeed?: number;
  /**
   * Processing frequency of tick(). Default is 1 / 60 (60fps).
   */
  intervalSec?: number;
  /**
   * Custom move function.
   */
  moveTo?: (x: number, y: number, z: number) => void;
}

/**
 * Joystick for touch operation.
*
* @example
* ```ts
import * as THREE from "three";
import { TouchController } from "three-touch-controller";

const playerEl:Object3D = ...;
const touchController = new TouchController(playerEl);

...
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = clock.getDelta();
  touchController.tick(dt);
});
* ```
 */
export class TouchController {
  /**
   * Movement speed. Default is 2.
   */
  moveSpeed = 0;
  /**
   * Rotation speed. Default is (50 * Math.PI) / 180.
   */
  rotationSpeed = 0;
  private _centerX = 0;
  private _centerY = 0;
  private _isTouch = false;
  private _isShowOuter = false;
  private _angle = 0;
  private _power = 0;
  private _maxDistance?: number;
  private _dVelocity: THREE.Vector3;
  private _target: THREE.Object3D;
  private _joystick: JoyStick;
  private _enabled = true;
  private _intervalSec = 0;
  private _sec = 0;
  private _moveTo?: (x: number, y: number, z: number) => void;

  /**
   * @param target - Object to move.
   */
  constructor(target: THREE.Object3D, options?: TouchControllerOptions) {
    this._target = target;
    this._dVelocity = new THREE.Vector3();
    this._joystick = createJoyStick();
    document.body.appendChild(this._joystick.container);

    this._onTouchStart = this._onTouchStart.bind(this);
    this._onTouchEnd = this._onTouchEnd.bind(this);
    this._onTouchCancel = this._onTouchCancel.bind(this);
    this._onTouchMove = this._onTouchMove.bind(this);
    this._onMouseStart = this._onMouseStart.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this.moveSpeed = options?.moveSpeed || DEFAULT_MOVE_SPEED;
    this.rotationSpeed = options?.rotationSpeed || DEFAULT_ROTATE_SPEED;
    this._intervalSec =
      options?.intervalSec || options?.intervalSec === 0
        ? options.intervalSec
        : DEFAULT_INTERVAL_SEC;
    this._moveTo = options?.moveTo;

    if (this._enabled) {
      this._addEventListeners();
    }
  }
  /**
   * When set to false, Will not respond to controls. Default is true.
   */
  get enabled() {
    return this._enabled;
  }
  set enabled(v: boolean) {
    v = !!v; // convert to bolean
    if (this._enabled === v) {
      return;
    }
    this._enabled = v;
    if (this._enabled) {
      this._addEventListeners();
    } else {
      this._removeEventListeners();
    }
  }
  /**
   * Releases all resources allocated by this instance.
   */
  dispose() {
    this.enabled = false;
    document.body.removeChild(this._joystick.container);
  }
  private _addEventListeners() {
    window.addEventListener("touchstart", this._onTouchStart);
    window.addEventListener("touchend", this._onTouchEnd);
    window.addEventListener("touchcancel", this._onTouchCancel);
    window.addEventListener("touchmove", this._onTouchMove);
    window.addEventListener("mousedown", this._onMouseStart);
    window.addEventListener("mouseup", this._onTouchEnd);
    window.addEventListener("mousecancel", this._onTouchCancel);
    window.addEventListener("mousemove", this._onMouseMove);
    document.body.addEventListener("contextmenu", this._onTouchCancel);
  }
  private _removeEventListeners() {
    window.removeEventListener("touchstart", this._onTouchStart);
    window.removeEventListener("touchend", this._onTouchEnd);
    window.removeEventListener("touchcancel", this._onTouchCancel);
    window.removeEventListener("touchmove", this._onTouchMove);
    window.removeEventListener("mousedown", this._onMouseStart);
    window.removeEventListener("mouseend", this._onTouchEnd);
    window.removeEventListener("mousecancel", this._onTouchCancel);
    window.removeEventListener("mousemove", this._onMouseMove);
    document.body.removeEventListener("contextmenu", this._onTouchCancel);
  }

  /**
   * Must be called periodically.
   *
   * @param deltaTime - `THREE.Clock.getDelta()`
   *
   * @example
   * ```ts
   * const clock = new THREE.Clock();
   * renderer.setAnimationLoop(() => {
   *   const dt = clock.getDelta();
   *   touchController.tick(dt);
   * });
   * ```
   * or
   * ```ts
   * const clock = new THREE.Clock();
   * setInterval(() => {
   *   const dt = clock.getDelta();
   *   touchController.tick(dt);
   * }, anything);
   * ```
   */
  tick(deltaTime: number) {
    if (!this._enabled) {
      return;
    }
    this._sec += deltaTime;
    if (this._sec < this._intervalSec) {
      return;
    }
    const dt = this._sec;
    this._sec = 0;

    if (this._isTouch && !this._isShowOuter) {
      const x = this._centerX;
      const y = this._centerY;
      this._isShowOuter = true;
      this._joystick.outer.style.top = y + "px";
      this._joystick.outer.style.left = x + "px";
      this._joystick.inner.style.top = y + "px";
      this._joystick.inner.style.left = x + "px";
      this._joystick.container.style.display = "block";
    }

    const moveSpeed = this.moveSpeed;
    const rotationSpeed = this.rotationSpeed;

    const power = this._power;
    if (power < 0.1) {
      return;
    }
    const angle = this._angle;
    const diffR = angleRight - angle;
    if (diffLimit > diffR && angle < angleRight) {
      this._target.rotation.y -=
        rotationSpeed * dt * ((diffLimit - diffR) / diffLimit) * power;
    } else {
      const diffL = angle - angleLeft;
      if (diffLimit > diffL) {
        this._target.rotation.y +=
          rotationSpeed * dt * ((diffLimit - diffL) / diffLimit) * power;
      } else if (angle >= 0) {
        if (angle < angleBack) {
          this._target.rotation.y =
            (this._target.rotation.y - rotationSpeed * dt * power) %
            (Math.PI * 2);
        } else {
          this._target.rotation.y =
            (this._target.rotation.y + rotationSpeed * dt * power) %
            (Math.PI * 2);
        }
      }
    }
    const diffF = diff(angle, angleForward);
    if (diffLimit > diffF) {
      const v = this._dVelocity;
      v.set(0, 0, -1);
      v.applyQuaternion(this._target.quaternion);
      const vp = (diffLimit - diffF) / diffLimit;

      const x = this._target.position.x + moveSpeed * v.x * dt * power * vp;
      const y = this._target.position.y + moveSpeed * v.y * dt * power * vp;
      const z = this._target.position.z + moveSpeed * v.z * dt * power * vp;
      if (this._moveTo) {
        this._moveTo(x, y, z);
      } else {
        this._target.position.set(x, y, z);
      }
    }
  }
  private _onTouchStart(e: TouchEvent) {
    if ((e.target as HTMLElement).tagName !== "CANVAS") {
      return;
    }
    // e.preventDefault();
    if (!e.targetTouches) {
      return;
    }
    const x = e.targetTouches[0].clientX;
    const y = e.targetTouches[0].clientY;
    this._onStart(x, y);
  }
  private _onMouseStart(e: MouseEvent) {
    if ((e.target as HTMLElement).tagName !== "CANVAS") {
      return;
    }
    // e.preventDefault();
    if (e.clientX === undefined) {
      return;
    }
    const x = e.clientX;
    const y = e.clientY;
    this._onStart(x, y);
  }
  private _onStart(x: number, y: number) {
    if (this._isTouch) {
      return;
    }
    this._isTouch = true;
    this._centerX = x;
    this._centerY = y;
  }
  private _clear() {
    this._power = 0;
    this._isShowOuter = false;
    this._isTouch = false;
    this._joystick.container.style.display = "none";
  }
  private _onTouchEnd(_e: Event) {
    // e.preventDefault();
    this._clear();
  }
  private _onTouchCancel(_e: Event) {
    // e.preventDefault();
    this._clear();
  }
  private _onTouchMove(e: TouchEvent) {
    // e.preventDefault();
    if (!e.targetTouches) {
      return;
    }
    const x = e.targetTouches[0].clientX;
    const y = e.targetTouches[0].clientY;
    this._onMove(x, y);
  }
  private _onMouseMove(e: MouseEvent) {
    if (e.clientX === undefined) {
      return;
    }
    const x = e.clientX;
    const y = e.clientY;
    this._onMove(x, y);
  }
  private _onMove(x: number, y: number) {
    // e.preventDefault();
    if (!this._isShowOuter) {
      if (this._isTouch) {
        this._centerX = x;
        this._centerY = y;
      }
      return;
    }

    const distance = Math.sqrt(
      Math.pow(x - this._centerX, 2) + Math.pow(y - this._centerY, 2)
    );
    if (!this._maxDistance) {
      const { width: outerW } = this._joystick.outer.getBoundingClientRect();
      const { width: innerW } = this._joystick.inner.getBoundingClientRect();
      this._maxDistance = (outerW - innerW) / 2;
    }
    const maxDistance = this._maxDistance;
    const angle = Math.atan2(y - this._centerY, x - this._centerX);
    if (distance > maxDistance) {
      x = this._centerX + maxDistance * Math.cos(angle);
      y = this._centerY + maxDistance * Math.sin(angle);
      this._power = 1;
    } else {
      this._power = distance / maxDistance;
    }

    this._joystick.inner.style.top = y + "px";
    this._joystick.inner.style.left = x + "px";

    this._angle = angle;
  }
}

type JoyStick = {
  container: HTMLElement;
  outer: HTMLElement;
  inner: HTMLElement;
};
function createJoyStick(): JoyStick {
  const container = document.createElement("div");
  container.style.pointerEvents = "none";
  container.style.position = "absolute";
  container.style.top = "0";
  container.style.left = "0";
  container.style.right = "0";
  container.style.bottom = "0";
  container.style.zIndex = "2";
  container.style.display = "none";
  container.style.userSelect = "none";
  container.style.webkitUserSelect = "none";

  const outer = document.createElement("div");
  outer.style.position = "absolute";
  outer.style.width = "150px";
  outer.style.height = "150px";
  outer.style.borderRadius = "50%";
  outer.style.border = "solid 5px #fff";
  outer.style.transform = "translate(-50%, -50%)";
  outer.style.userSelect = "none";
  outer.style.webkitUserSelect = "none";
  container.appendChild(outer);

  const inner = document.createElement("div");
  inner.style.position = "absolute";
  inner.style.width = "50px";
  inner.style.height = "50px";
  inner.style.borderRadius = "50%";
  inner.style.backgroundColor = "#fff";
  inner.style.transform = "translate(-50%, -50%)";
  inner.style.userSelect = "none";
  inner.style.webkitUserSelect = "none";
  container.appendChild(inner);

  return {
    container,
    outer,
    inner,
  };
}
