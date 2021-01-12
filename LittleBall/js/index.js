const THREE = require('three')
class LittleBall {
  constructor(document, window) {
    this.document = document
    this.window = window
  }
  get PI() {
    return Math.PI
  }
  get PI2() {
    return Math.PI * 2
  }
  init() {
    this.windowWidth = this.window.innerWidth
    this.windowHeight = this.window.innerHeight
    // 场景
    this.scene = new THREE.Scene()

    // 摄像机
    this.camera = new THREE.PerspectiveCamera(60, this.windowWidth / this.windowHeight, 1, 1000)
    this.camera.position.set(0, 500, 200)
    this.camera.lookAt(0, 350, 0)

    // 光源
    this.buildLight()

    // 辅助坐标系
    var axisHelper = new THREE.AxesHelper()
    this.scene.add(axisHelper)

    this.renderer = new THREE.WebGL1Renderer()
    this.renderer.setSize(this.windowWidth, this.windowHeight)
    this.renderer.setClearColor('#000')
    this.renderer.shadowMap.enabled = true;


    this.meshSet = new Set()
    this.mainMeshSet = new Set()

    this.itemY = 500

    this.buildCylinder()
    this.buildBall()
    this.bindListener()
  }
  buildLight() {// 光源
    var spotLight = new THREE.AmbientLight(0xffffff)
    this.scene.add(spotLight)
  }
  buildCylinder() {// 中间圆柱
    this.centerCylinderRadis = 20
    const geometry = new THREE.CylinderGeometry(this.centerCylinderRadis,this.centerCylinderRadis,1000,100,100)
    const material = new THREE.MeshBasicMaterial({
      color: '#334455',
      wireframe: false
    })
    
    const mesh = new THREE.Mesh(geometry, material)
    const object = new THREE.Object3D()
    object.add(mesh)
    this.object = object
    this.produceItems()
    this.scene.add(object)
  }
  produceItems() {
    let cylinderCount = 5
    const curCount = this.object.children.length
    for(let index = 0; index < cylinderCount - curCount; index ++) {
      this.buildSectorCylinder(this.itemY -= 50)
    }
  }
  buildSectorCylinder(y) {// 扇形圆柱
    const r = 50, height = 10, color = '#3300aa'
    let startRandom = 0,
      hole = Math.min(Math.max(this.PI / 6, Math.random() * this.PI2), this.PI / 2),
      endRandom = this.PI2 - hole,
      randomRotateY = Math.random() * this.PI2
    const geometry = new THREE.CylinderBufferGeometry(r, r, height, 40, 40, false, startRandom, endRandom)
    const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide
    }))
    mesh.position.y = y
    
    const spin1 = new THREE.BoxBufferGeometry(1, height, r * 2, 40, 40, 40)
    const spin1Mesh = new THREE.Mesh(spin1, new THREE.MeshBasicMaterial({
      color
    }))
    spin1Mesh.position.y = y
    spin1Mesh.needCheckCollision = true

    const spin2 = new THREE.BoxBufferGeometry(1, height, r * 2, 40, 40, 40)
    const spin2Mesh = new THREE.Mesh(spin2, new THREE.MeshBasicMaterial({
      color
    }))
    spin2Mesh.position.y = y
    spin2Mesh.rotation.y -= hole


    ;[mesh, spin1Mesh, spin2Mesh].forEach(i => {
      i.rotation.y += randomRotateY
      this.meshSet.add(i)
    })

    const object = new THREE.Object3D()
    object.add(mesh, spin2Mesh, spin1Mesh)

    this.mainMeshSet.add(mesh)

    this.object.add(object)
  }
  buildBall() {
    const box = new THREE.BoxGeometry(3, 3, 3)
    const boxMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0
    })
    const boxMesh = new THREE.Mesh(box, boxMaterial)
    boxMesh.position.set(0, 470, this.centerCylinderRadis + 20)

    const ball = new THREE.SphereGeometry(3, 30, 30)
    const ballMaterial = new THREE.MeshBasicMaterial({
      color: '#113377'
    })
    const ballMesh = new THREE.Mesh(ball, ballMaterial)
    ballMesh.position.set(0, 470, this.centerCylinderRadis + 20)

    this.box = boxMesh
    this.ball = ballMesh

    this.gravity = 0.001
    
    this.speed = 0.01
    this.init = {
      gravity: this.gravity,
      speed: this.speed,
      gravitySpeed: 0.01
    }
    const update = () => {
      ;[this.box, this.ball].forEach(i => {
        i.position.y -= this.speed
        this.speed += this.gravity
      })
    }

    this.ball.update = update
    this.scene.add(boxMesh, ballMesh)
  }
  onkey38down() {
    if (this.keystatus !== 'up') {
      this.keystatus = 'up'
      this.speed = 0
      this.gravity = -this.init.gravity
    }
  }
  onkey38up() {
    this.keystatus = ''
    this.speed = 0
    this.gravity = this.init.gravity
  }
  onkey40down() {
    this.gravity += this.init.gravitySpeed
  }
  onkey40up() {
    this.gravity = this.init.gravity
  }
  bindListener() {
    window.addEventListener('keydown', event => {
      switch (event.keyCode) {
        case 38:
          this.onkey38down()
          break;
        case 40:
          this.onkey40down()
          break;
        default:
          break;
      }
    })
    window.addEventListener('keyup', e => {
      switch (event.keyCode) {
        case 38:
          this.onkey38up()
          break;
        case 40:
          this.onkey40up()
          break;
        default:
          break;
      }
    })
  }
  checkCollision() {
    let crash = false
    let movingCube = this.box
    let collideMeshList = this.object.children
    var originPoint = movingCube.position.clone();
    for (var vertexIndex = 0; vertexIndex < movingCube.geometry.vertices.length; vertexIndex++) {
        // 顶点原始坐标
        var localVertex = movingCube.geometry.vertices[vertexIndex].clone();
        // 顶点经过变换后的坐标
        var globalVertex = localVertex.applyMatrix4(movingCube.matrix);
        // 获得由中心指向顶点的向量
        var directionVector = globalVertex.sub(movingCube.position);

        // 将方向向量初始化
        var ray = new THREE.Raycaster(originPoint, directionVector.clone().normalize());
        // 检测射线与多个物体的相交情况
        var collisionResults = ray.intersectObjects(collideMeshList);
        // 如果返回结果不为空，且交点与射线起点的距离小于物体中心至顶点的距离，则发生了碰撞
        if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length()) {
            crash = true;   // crash 是一个标记变量
        }
    }
    return crash
  }
  checkToDeleteItems() {
    const ballY = this.ball.position.y
    for(let mesh of this.mainMeshSet) {
      if (mesh.position.y > ballY) {
        this.object.remove(mesh.parent)
        this.mainMeshSet.delete(mesh)
        mesh.geometry.dispose()
        mesh.material.dispose()
      }
    }
  }
  animation() {
    this.object.rotation.y -= 0.01

    // 摄像机看向球
    const {x, y, z} = this.ball.position
    this.camera.position.set(x + 50, y + 50, z + 150)
    this.camera.lookAt(x, y, z)

    // if (this.check()) {
    //   console.log(1)
    // }
    
    this.checkToDeleteItems()

    this.produceItems()

    this.ball.update()

    this.renderer.render(this.scene, this.camera)
  }
  render() {
    this.init()
    this.document.body.appendChild(this.renderer.domElement)
    setInterval(this.animation.bind(this), 1000 / 60)
    // this.animation()
    // this.renderer.setAnimationLoop(this.animation.bind(this))
  }
}
new LittleBall(document, window).render()