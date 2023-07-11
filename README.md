# three-touch-controller &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/VerseEngine/three-touch-controller/blob/main/LICENSE)  [![npm version](https://img.shields.io/npm/v/@verseengine%2Fthree-touch-controller.svg?style=flat)](https://www.npmjs.com/package/@verseengine%2Fthree-touch-controller)  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/VerseEngine/three-touch-controller/pulls)
 
 Joystick for touch operation.

 ![preview](https://user-images.githubusercontent.com/20784450/211957791-de29676f-9d82-42d4-be44-2300944a8383.gif)

## Installation
### npm
```bash
npm install @verseengine/three-touch-controller
```

### CDN (ES Mobules)
```html
<script
      async
      src="https://cdn.jsdelivr.net/npm/es-module-shims@1.6.2/dist/es-module-shims.min.js"
    ></script>
<script type="importmap">
  {
    "imports": {
      "three": "https://cdn.jsdelivr.net/npm/three@0.137.0/build/three.module.js",
      "three-touch-controller": "https://cdn.jsdelivr.net/npm/@verseengine/three-touch-controller@1.0.1/dist/esm/index.js"
    }
  }
</script>
```

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
