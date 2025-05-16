import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.118.3/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.118.3/examples/jsm/controls/OrbitControls.js";
import Rainbow from "https://esm.sh/rainbowvis.js";

let scene = new THREE.Scene();

let aspect = innerWidth / innerHeight;
let frustumSize = 20;
let camera = new THREE.OrthographicCamera(
  (frustumSize * aspect) / -2,
  (frustumSize * aspect) / 2,
  frustumSize / 2,
  frustumSize / -2,
  1,
  1000
);
camera.position.setScalar(10);
camera.lookAt(scene.position);

let renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

//////////////////////////////////////////////////////////////////
// RainbowVis-JS
let iCount = 50;

let rainbow = new Rainbow();
rainbow.setNumberRange(0, iCount - 1);


const N = 3;


switch (N) 
			{
case 1: rainbow.setSpectrum("yellow", "orange", "red", "black");break;// fire smt
case 2: rainbow.setSpectrum("cyan", "magenta", "yellow", "black");break; // CMYK core
case 3: rainbow.setSpectrum("white", "silver", "gray", "black");break;   //B&W with extra steps
case 4: rainbow.setSpectrum("black", "gray", "silver", "white");break;//B&W with extra steps in reverse
			}													
												

let colors = new Float32Array(iCount * 3);
for (let i = 0; i < iCount; i++) 
					{
  let hex = rainbow.colourAt(i);
  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;

  colors[i * 3] = r;
  colors[i * 3 + 1] = g;
  colors[i * 3 + 2] = b;
					}

// Геометрия, материал, объект
let dummy = new THREE.Object3D();
let g = new THREE.BoxBufferGeometry(10, 10, 10);
let m = new THREE.MeshBasicMaterial();

g.setAttribute("color", new THREE.InstancedBufferAttribute(colors, 3));

//VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//////////////////////////////VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
m.onBeforeCompile = shader => {
  shader.vertexShader = shader.vertexShader.replace(
    `#include <common>`,
    `#include <common>
    attribute vec3 color;
    varying vec3 vColor;
  `
  ).replace(
    `#include <begin_vertex>`,
    `#include <begin_vertex>
    vColor = color;
  `
  );

  shader.fragmentShader = shader.fragmentShader.replace(
    `#include <common>`,
    `#include <common>
    varying vec3 vColor;
  `
  ).replace(
    `vec4 diffuseColor = vec4( diffuse, opacity );`,
    `vec4 diffuseColor = vec4(vColor, opacity);`
  );
};
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^///////////////////////////////^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

let o = new THREE.InstancedMesh(g, m, iCount);
o.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
scene.add(o);

let maxRotation = new THREE.Euler(Math.PI, Math.PI, 0);
let maxScale = new THREE.Vector3().setScalar(0.5);

window.addEventListener("resize", onWindowResize, false);

let clock = new THREE.Clock();

renderer.setAnimationLoop(() => {
  let t = clock.getElapsedTime() * 0.5;
  let s = Math.sin(t) * 0.5 + 0.5;

  for (let i = 0; i < iCount; i++) {
    let factor = i / (iCount - 1) * s;
    dummy.position.setScalar((iCount - i) * -10);
    dummy.rotation.set(
      maxRotation.x * factor,
      maxRotation.y * factor,
      maxRotation.z * factor
    );
    dummy.scale.set(
      1 - maxScale.x * factor,
      1 - maxScale.y * factor,
      1 - maxScale.z * factor
    );
    dummy.updateMatrix();
    o.setMatrixAt(i, dummy.matrix);
  }
  o.instanceMatrix.needsUpdate = true;

  renderer.render(scene, camera);
});

function onWindowResize() {
  var aspect = innerWidth / innerHeight;

  camera.left = (-frustumSize * aspect) / 2;
  camera.right = (frustumSize * aspect) / 2;
  camera.top = frustumSize / 2;
  camera.bottom = -frustumSize / 2;

  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
}
