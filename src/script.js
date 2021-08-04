import './style.css'
import * as dat from 'dat.gui'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import firefliesVertexShader from './shaders/fireflies/vertex.glsl'
import firefliesVertexFragmentShader from './shaders/fireflies/fragment.glsl'

/**
 * Base
 */
// Debug
const debugObject = {}
const gui = new dat.GUI({
    width: 400
})

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Loaders
 */
// Texture loader
const textureLoader = new THREE.TextureLoader()

// Draco loader
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('draco/')

// GLTF loader
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

/**
 * textures
 */
const bakedTexture = textureLoader.load('baked.jpg');
bakedTexture.flipY=false;
bakedTexture.encoding=THREE.sRGBEncoding;

//materials
//baked material
const bakedMaterial = new THREE.MeshBasicMaterial({map: bakedTexture});
const portalLightMaterial = new THREE.MeshBasicMaterial({color : 0xffffff})
const poleLightMaterial = new THREE.MeshBasicMaterial({color:0xffffe5});

gltfLoader.load('portal.glb',(gltf)=>{
    gltf.scene.traverse((child)=>{
        
        child.material= bakedMaterial;
        
    })
    const portalLightMesh=gltf.scene.children.find(child=> child.name === 'portalLight')
    const poleLightAMesh=gltf.scene.children.find(child=> child.name === 'poleLightA')
    const poleLightBMesh=gltf.scene.children.find(child=> child.name === 'poleLightB')
    poleLightAMesh.material=poleLightMaterial
    poleLightBMesh.material=poleLightMaterial
    portalLightMesh.material=portalLightMaterial;
    gltf.scene.rotation.y=Math.PI;
    scene.add(gltf.scene)

})
/**
 * firefly
 **/
//gemotery

const firefliesGemotery = new THREE.BufferGeometry();
const firefliesCount = 30
const postionArray = new Float32Array(firefliesCount*3);
const scaleArray = new Float32Array(firefliesCount);
for(let i =0 ;i< firefliesCount;i++){
     postionArray[i*3]=(Math.random()-0.5)*4
     postionArray[i*3+1]=Math.random()*1.5
     postionArray[i*3+2]=(Math.random()-0.5)*4
     scaleArray[i] = Math.random()
}
firefliesGemotery.setAttribute('aScale',new THREE.BufferAttribute(scaleArray,1))
firefliesGemotery.setAttribute('position',new THREE.BufferAttribute(postionArray,3))
const firefliesMaterial = new THREE.ShaderMaterial({
    blending : THREE.AdditiveBlending,
    depthWrite:false, 
    vertexShader:firefliesVertexShader,
    fragmentShader:firefliesVertexFragmentShader,
    uniforms : {
        uPixelRatio : { value : Math.min(window.devicePixelRatio,2)},
        uSize : {value : 100},
        uTime : {value : 0}
    },
    transparent:true
},)
gui.add(firefliesMaterial.uniforms.uSize,'value').min(0).max(500).step(1).name('firefliesSize')
// Points 
const fireflies = new THREE.Points(firefliesGemotery,firefliesMaterial)
scene.add(fireflies)
/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    //Update fireflies
    firefliesMaterial.uniforms.uPixelRatio.value =Math.min(window.devicePixelRatio, 2)
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 4
camera.position.y = 2
camera.position.z = 4
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.outputEncoding=THREE.sRGBEncoding
debugObject.clearColor = '#201919'
gui.addColor(debugObject,'clearColor').onChange(()=>{
    renderer.setClearColor(debugObject.clearColor)
})
renderer.setClearColor(debugObject.clearColor)

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    // Update materials
    firefliesMaterial.uniforms.uTime.value=elapsedTime;

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()