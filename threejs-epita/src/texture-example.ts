import {
  DirectionalLight,
  LoadingManager,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PCFSoftShadowMap,
  PlaneBufferGeometry,
  PMREMGenerator,
  RepeatWrapping,
  ShadowMaterial,
  Texture,
  TextureLoader,
  WebGLRenderer,
} from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { HDRCubeTextureLoader } from "three/examples/jsm/loaders/HDRCubeTextureLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Example } from "./example";

export default class TextureExample extends Example {
  constructor(renderer: WebGLRenderer) {
    super(renderer);

    this._renderer.shadowMap.enabled = true;
    this._renderer.shadowMap.type = PCFSoftShadowMap;

    /**
     * Controls.
     */
    const orbitControls = new OrbitControls(
      this._cam,
      this._renderer.domElement
    );
    orbitControls.update();

    // const cameraHelper = new CameraHelper(directionalLight.shadow.camera);
    // const helper = new DirectionalLightHelper(directionalLight);
    // this._scene.add(helper, cameraHelper);
  }

  public initialize() {
    super.initialize();

    /**
     * Load textures and object.
     */
    const loadManager = new LoadingManager();
    loadManager.onProgress = function (item, loaded, total) {
      console.log(item, loaded, total);
    };

    const textureLoader = new TextureLoader(loadManager);

    /**
     * Create materials from loaded textures.
     */
    const textures: Texture[] = [
      textureLoader.load("assets/textures/rust/albedo.png"),
      textureLoader.load("assets/textures/rust/normal.png"),
      textureLoader.load("assets/textures/rust/metallic.png"),
      textureLoader.load("assets/textures/rust/roughness.png"),
    ];

    for (var texture of textures) {
      texture.wrapS = RepeatWrapping;
      texture.wrapT = RepeatWrapping;
    }

    const material = new MeshStandardMaterial({
      color: 0xffffff,
      map: textures[0],
      normalMap: textures[1],
      metalnessMap: textures[2],
      metalness: 1,
      roughnessMap: textures[3],
      roughness: 0.5,
    });

    const loader = new OBJLoader();
    loadManager.onLoad = () => {
      loader.load(
        "assets/models/material_sphere.obj",
        (obj: Object3D) => {
          /**
           * For any mesh in the loaded object, add our materials.
           */
          obj.traverse((elm) => {
            if ((elm as Mesh).isMesh) {
              (elm as Mesh).castShadow = true;
              (elm as Mesh).material = material;
            }
          });
          obj.position.set(0, 0, 0);
          this._scene.add(obj);
        },
        undefined,
        (err) => console.log(err)
      );
    };

    /**
     * Add a directional light.
     */
    const directionalLight = new DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(-3, 1.5, 2);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.set(512, 512);
    directionalLight.shadow.camera.far = 8;
    directionalLight.shadow.camera.near = 0.5;

    this._scene.add(directionalLight);

    /**
     * Add a plane to see the shadow.
     */
    const geometry = new PlaneBufferGeometry(8, 8);
    const plane = new Mesh(geometry, new ShadowMaterial());
    plane.position.set(0, -0.6, 0);
    plane.rotateX(-Math.PI / 2);
    plane.receiveShadow = true;
    this._scene.add(plane);

    /**
     * Environment.
     */
    const gen = new PMREMGenerator(this._renderer);
    gen.compileCubemapShader();
    const hdrCubemap = new HDRCubeTextureLoader()
      .setPath("assets/env/pisa/")
      .load(
        ["px.hdr", "nx.hdr", "py.hdr", "ny.hdr", "pz.hdr", "nz.hdr"],
        () => {
          const target = gen.fromCubemap(hdrCubemap);
          this._scene.environment = target.texture;
        }
      );

    this._scene.background = hdrCubemap;
  }

  public destroy(): void {
    super.destroy();
    // @todo
  }

  public update(): void {
    // @todo
  }
}
