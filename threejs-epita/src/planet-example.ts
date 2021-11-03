import {
  CircleGeometry,
  EdgesGeometry,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PointLight,
  SphereGeometry,
  WebGLRenderer,
} from "three";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import { Example } from "./example";

interface SystemVelocity {
  velocity: number;
}

export default class PlanetsExample extends Example {
  private earth: Mesh<SphereGeometry, MeshStandardMaterial> | null = null;
  private mars: Mesh<SphereGeometry, MeshStandardMaterial> | null = null;
  private sun: Mesh<SphereGeometry, MeshBasicMaterial> | null = null;

  private disposableMaterial: Set<
    MeshStandardMaterial | MeshBasicMaterial | LineBasicMaterial
  >;
  private disposableGeometry: Set<
    SphereGeometry | CircleGeometry | EdgesGeometry
  >;

  private systemVelocity: SystemVelocity;
  private earthVelocity: SystemVelocity;
  private marsVelocity: SystemVelocity;

  constructor(renderer: WebGLRenderer) {
    super(renderer);

    this.systemVelocity = {
      velocity: 0.0015,
    };
    this.earthVelocity = {
      velocity: 0.005,
    };
    this.marsVelocity = {
      velocity: 0.003,
    };

    this.disposableMaterial = new Set();
    this.disposableGeometry = new Set();
  }

  public initialize(): void {
    super.initialize();

    /**
     * Orbit material.
     */
    const lineMaterial = new LineBasicMaterial({
      color: "#FFFFF",
      linewidth: 1,
    });
    this.disposableMaterial.add(lineMaterial);

    /**
     * Create a sun. It is not sensible to light.
     */
    const basicMaterial = new MeshBasicMaterial();
    this.disposableMaterial.add(basicMaterial);
    const sunGeometry = new SphereGeometry(0.1, 32, 16);
    this.disposableGeometry.add(sunGeometry);

    this.sun = new Mesh(sunGeometry, basicMaterial);
    this.sun.material.color.set("#F5CB5C");
    this._scene.add(this.sun);

    /**
     * Create the light emitted by the sun.
     */
    const light = new PointLight("#00000", 2, 5, 1);
    light.position.set(0, 0, 0);
    this.sun.add(light);

    /**
     * Distance between the Earth and the Sun.
     */
    var earthDistOrbit = 0.5;

    /**
     * Create the Earth. It is sensible to light.
     */
    const earthMaterial = new MeshStandardMaterial();
    this.disposableMaterial.add(earthMaterial);
    const earthGeom = new SphereGeometry(0.05, 10, 5);
    this.disposableGeometry.add(earthGeom);

    this.earth = new Mesh(earthGeom, earthMaterial);
    this.earth.material.color.set("#2E798A");
    this.earth.position.set(earthDistOrbit, 0, 0);

    this.sun.add(this.earth);

    /**
     * Create Earth's orbit.
     */
    const circleGeom = new CircleGeometry(earthDistOrbit, 100);
    this.disposableGeometry.add(circleGeom);

    const orbitEdges = new EdgesGeometry(circleGeom);
    this.disposableGeometry.add(orbitEdges);

    const orbit = new LineSegments(orbitEdges, lineMaterial);
    orbit.position.set(0, 0, 0);
    this._scene.add(orbit);

    /**
     * Controls.
     */
    const orbitControls = new OrbitControls(
      this._cam,
      this._renderer.domElement
    );
    orbitControls.update();

    /**
     * Create Mars.
     */
    const marsMaterial = new MeshStandardMaterial();
    this.disposableMaterial.add(marsMaterial);
    const marsGeom = new SphereGeometry(0.03, 10, 5);
    this.disposableGeometry.add(marsGeom);

    this.mars = new Mesh(marsGeom, marsMaterial);
    this.mars.material.color.set("#B26E63");
    this.mars.position.set(0.3, -0.6, 0);
    this.sun.add(this.mars);

    /**
     * Mars orbit.
     */
    const marsDist = Math.sqrt(0.3 * 0.3 + 0.6 * 0.6);

    const marsOrbitGeom = new CircleGeometry(marsDist, 100);
    this.disposableGeometry.add(marsOrbitGeom);
    const marsOrbitEdge = new EdgesGeometry(marsOrbitGeom);
    this.disposableGeometry.add(marsOrbitEdge);

    const marsOrbit = new LineSegments(marsOrbitEdge, lineMaterial);
    this._scene.add(marsOrbit);

    /**
     * GUI
     */
    let lightIntensity = this._gui.addFolder("LightIntensity");
    lightIntensity.add(light, "intensity", 0, 4).name("Intensity").listen();
    lightIntensity.open();

    var velocity = this._gui.addFolder("Velocity");
    velocity
      .add(this.systemVelocity, "velocity", 0, 0.5)
      .name("SystemVelocity")
      .listen();
    velocity
      .add(this.earthVelocity, "velocity", 0, 0.5)
      .name("EarthVelocity")
      .listen();
    velocity
      .add(this.marsVelocity, "velocity", 0, 0.5)
      .name("MarsVelocity")
      .listen();
    velocity.open();
  }

  public destroy(): void {
    super.destroy();
    this.disposableMaterial.forEach((elm) => elm.dispose());
    this.disposableGeometry.forEach((elm) => elm.dispose());
    this.disposableGeometry.clear();
    this.disposableMaterial.clear();
    /**
     * Should remove scene's objects.
     */
    this._scene.clear();
  }

  public update(delta: number, _: number): void {
    if (this.earth && this.sun && this.mars) {
      this.sun.rotateZ(this.systemVelocity.velocity);
      this.earth.rotateZ(this.earthVelocity?.velocity);
      this.mars.rotateZ(this.marsVelocity?.velocity);
    }
    this._renderer.render(this._scene, this._cam);
  }
}
