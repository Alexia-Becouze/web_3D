import {
  AnimationMixer,
  Clock,
  Color,
  DirectionalLight,
  LightShadow,
  Mesh,
  Object3D,
  PointLight,
  Vector2,
  WebGLRenderer,
} from "three";
import { Example } from "./example";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

export default class GLTFExample extends Example {
  _clock: Clock;
  _mixer: AnimationMixer | undefined;
  _composer: EffectComposer;
  _bokeh: BokehPass | undefined;

  _lights: any = [];

  constructor(renderer: WebGLRenderer) {
    super(renderer);

    this._clock = new Clock();
    this._composer = new EffectComposer(this._renderer);

    /**
     * Controls.
     */
    const orbitControls = new OrbitControls(
      this._cam,
      this._renderer.domElement
    );
    orbitControls.update();

    /**
     * Lights.
     */
    const directionalLight = new DirectionalLight(0xffecd6, 1.3);
    directionalLight.position.set(-3, 5, -5);
    this._lights.push(directionalLight);

    const pointLight = new PointLight();
    pointLight.position.set(3, 1.5, 3);
    this._lights.push(pointLight);

    /**
     * GUI
     */
    let lightIntensity = this._gui.addFolder("Light");
    lightIntensity.add(directionalLight, "intensity", 0, 2).name("Intensity");
    var color = { color: 0xffffff };
    lightIntensity
      .addColor(color, "color")
      .listen()
      .onChange(() => {
        directionalLight.color.set(color.color);
        pointLight.color.set(color.color);
        this._scene.background = new Color(color.color).lerp(
          new Color(0xffecd6),
          0.7
        );
      })
      .name("Color");
    lightIntensity.open();

    this._scene.background = new Color(0xdce2c8);

    /**
     * Post processing.
     * https://threejs.org/docs/#manual/en/introduction/How-to-use-post-processing
     */
    const params = {
      focus: 1.0,
      aperture: 1.5,
      maxblur: 0.0,

      width: window.innerWidth,
      height: window.innerHeight,
    };

    /**
     * RenderPass is normally placed at the beginning of the chain in order to
     * provide the rendered scene as an input for the next post-processing step.
     */
    const renderPass = new RenderPass(this._scene, this._cam);
    this._composer.addPass(renderPass);

    this._bokeh = new BokehPass(this._scene, this._cam, params);

    /**
     * https://github.com/mrdoob/three.js/blob/master/examples/webgl_postprocessing_dof.html
     */
    let depthOfField = this._gui.addFolder("FieldOfDepth");
    depthOfField
      .add(params, "focus", 0, 5)
      .name("Focus")
      .onChange(() => {
        (this._bokeh?.uniforms as any)["focus"].value = params.focus;
      });
    depthOfField
      .add(params, "aperture", 0, 10)
      .name("Aperture")
      .onChange(() => {
        (this._bokeh?.uniforms as any)["aperture"].value = params.aperture;
      });
    depthOfField
      .add(params, "maxblur", 0, 0.1)
      .name("Maxblur")
      .onChange(() => {
        (this._bokeh?.uniforms as any)["maxblur"].value = params.maxblur;
      });

    depthOfField.open();

    this._composer.addPass(this._bokeh);

    const bloomParams = {
      bloomStrength: 0.4,
      bloomThreshold: 0.8,
      bloomRadius: 0.4,
    };

    const bloomPass = new UnrealBloomPass(
      new Vector2(window.innerWidth, window.innerHeight),
      bloomParams.bloomStrength,
      bloomParams.bloomRadius,
      bloomParams.bloomThreshold
    );

    this._composer.addPass(bloomPass);

    let neonEffect = this._gui.addFolder("NeonEffect");
    neonEffect
      .add(bloomParams, "bloomStrength", 0, 2)
      .name("Strength")
      .onChange(() => {
        bloomPass.strength = bloomParams.bloomStrength;
      });
    neonEffect
      .add(bloomParams, "bloomThreshold", 0, 1)
      .name("Threshold")
      .onChange(() => {
        bloomPass.threshold = bloomParams.bloomThreshold;
      });
    neonEffect
      .add(bloomParams, "bloomRadius", 0, 1)
      .name("Radius")
      .onChange(() => {
        bloomPass.radius = bloomParams.bloomRadius;
      });
    neonEffect.open();
  }

  public initialize() {
    super.initialize();

    /**
     * Load mesh.
     * https://threejs.org/docs/#examples/en/loaders/GLTFLoader
     */
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("node_modules/three/examples/js/libs/draco/");
    loader.setDRACOLoader(dracoLoader);

    loader.load("assets/models/LittlestTokyo.glb", (elm: GLTF) => {
      elm.scene.position.set(1, 1, 0);
      elm.scene.scale.set(0.01, 0.01, 0.01);

      /**
       * Instead of calling AnimationAction constructor directly you should
       * instantiate an AnimationAction with AnimationMixer.clipAction since
       * this method provides caching for better performance.
       */
      this._mixer = new AnimationMixer(elm.scene);
      this._mixer.clipAction(elm.animations[0]).play();

      this._scene.add(elm.scene);
    });

    for (const elm of this._lights) {
      this._scene.add(elm);
    }
  }

  public destroy(): void {
    super.destroy();

    this._scene.traverse((child: Object3D) => {
      const mesh = child as Mesh;
      if (mesh.isMesh) {
        mesh.geometry.dispose();
        const materials = Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material];
        for (const mat of materials) {
          mat.dispose();
        }
      }
    });

    this._scene.clear();
  }

  /**
   * To not call parent function render().
   */
  public render() {
    this._composer.render();
  }

  public update(): void {
    const delta = this._clock.getDelta();
    this._mixer?.update(delta);
    this._renderer.render(this._scene, this._cam);
  }

  public resize(w: number, h: number) {
    super.resize(w, h);

    this._bokeh?.renderTargetDepth.setSize(w, h);
    this._composer.setSize(w, h);
  }
}
