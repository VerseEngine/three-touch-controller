# three-touch-controller
 
 Joystick for touch operation.

 ![preview](https://user-images.githubusercontent.com/20784450/211957791-de29676f-9d82-42d4-be44-2300944a8383.gif)


## Example
```bash
npm run example
```

## Usage
```javascript
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
```

# Reference

## API Reference
[Link](docs/three-touch-controller.md)
