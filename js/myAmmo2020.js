/**
 * @fileOverview Ammo のラッパー。
 * @author K.Miyawaki
 */

var mylib2020 = mylib2020 || {};

/**
 * Ammo 物理エンジンへの物体の登録/削除などを行い、物理計算を実行する。
 */
mylib2020.AmmoManager = class {
    /**
     * @param {THREE.Scene} scene Three.js のシーン。
     * @param {THREE.Vector3} gravity 重力の方向。 
     * @param {number} subStep 物理計算の分割数。1 ステップの経過時間をさらに分割して計算したい場合に利用する。 
     */
    constructor(scene, gravity = { x: 0, y: -9.8, z: 0 }, subStep = 1) {
        this.scene = scene;
        [this.world, this.dispatcher, this.overlappingPairCache, this.solver, this.collisionConfiguration]
            = mylib2020.initAmmo(gravity);
        this.targetObjects = new Set();
        this.subStep = subStep;
        this.collisionBuilder = new mylib2020.AmmoCollisionBuilder();
        this.rigidBodyPose = new mylib2020.AmmoRigidBodyPose();
        this.transform = new Ammo.btTransform();
    }

    applyPhysics(threeObject) {
        if (threeObject.userData.rigidBody) {
            mylib2020.applyAmmo(threeObject, threeObject.userData.rigidBody, this.transform);
        }
    }

    /**
     * 物体を弾き飛ばす、ジャンプさせるなど瞬間的な力を加える。
     * @param {THREE.Object3D} threeObject userData.rigidBody に Ammo.btRigidBody を持つ物体。
     * @param {THREE.Vector3} impulse 力の方向。 
     */
    addImpulse(threeObject, impulse) {
        if (threeObject.userData.rigidBody) {
            mylib2020.addImpulse(threeObject.userData.rigidBody, impulse);
        }
    }

    /**
     * 物体を指定した方向に押す。
     * @param {THREE.Object3D} threeObject userData.rigidBody に Ammo.btRigidBody を持つ物体。
     * @param {THREE.Vector3} force 力の方向。 
     */
    addForce(threeObject, force) {
        if (threeObject.userData.rigidBody) {
            mylib2020.addForce(threeObject.userData.rigidBody, force);
        }
    }

    /**
     * 物体をシーンと物理エンジンに登録する。CG も表示されるし、物理計算の影響も受けるようになる。
     * @param {THREE.Object3D} threeObject userData.rigidBody に Ammo.btRigidBody を持つ物体。
     */
    registerObject(threeObject) {
        if (this.targetObjects.has(threeObject)) {
            return false;
        }
        this.scene.add(threeObject);
        this.targetObjects.add(threeObject);
        if (threeObject.userData.rigidBody) {
            this.world.addRigidBody(threeObject.userData.rigidBody);
            threeObject.userData.collision = new mylib2020.AmmoCollisionManager();
        }
    }

    /**
     * 物体が物理エンジンの管理下にあるかどうか。
     * @param {boolean} threeObject 検査対象。
     */
    has(threeObject) {
        return this.targetObjects.has(threeObject);
    }

    /**
     * 物理計算を 1 ステップ行う。<br/>
     * userData.movable が true かつ、 userData.linearVelocity もしくは userData.angularVelocity に速度を持つ物体は移動した上で物理エンジンの影響を受ける。
     * @param {number} delta 経過時間。
     */
    update(delta) {
        for (let k of this.targetObjects) {
            if (!k.userData.movable) {
                continue;
            }
            if (k.userData.linearVelocity) {
                k.translateOnAxis(mylib2020.FORWARD, k.userData.linearVelocity * delta);
            }
            if (k.userData.angularVelocity) {
                k.rotateY(k.userData.angularVelocity * delta);
            }
            this.rigidBodyPose.synch(k);
        }
        this.world.stepSimulation(delta, this.subStep);
        for (let k of this.targetObjects) {
            this.applyPhysics(k);
        }
        this.updateCollision();
    }

    updateCollision() {
        const numManifolds = this.dispatcher.getNumManifolds();
        for (let i = 0; i < numManifolds; i++) {
            const manifold = this.dispatcher.getManifoldByIndexInternal(i); // btPersistentManifold
            const obA = Ammo.btRigidBody.prototype.upcast(manifold.getBody0()); // btCollisionObject 
            const obB = Ammo.btRigidBody.prototype.upcast(manifold.getBody1()); // btCollisionObject
            if (!obA.threeObject || !obB.threeObject) {
                console.log("updateCollision: found unregistered objects");
                continue;
            }
            const numContacts = manifold.getNumContacts(); // オブジェクト間の衝突点数
            for (let j = 0; j < numContacts; j++) {
                const pt = manifold.getContactPoint(j);//btManifoldPoint
                if (pt.getDistance() <= 0.0) {
                    const ptA = pt.getPositionWorldOnA(); // btVector3
                    const ptB = pt.getPositionWorldOnB(); // btVector3
                }
            }
            if (numContacts > 0) {
                obA.threeObject.userData.collision.addNewCollision(obB.threeObject);
                obB.threeObject.userData.collision.addNewCollision(obA.threeObject);
            }
        }
        for (let obj of this.targetObjects) {
            obj.userData.collision.update();
        }
    }

    removePhysics(threeObject) {
        if (threeObject.userData.collision) {
            delete threeObject.userData.collision;
        }
        if (threeObject.userData.rigidBody) {
            this.world.removeRigidBody(threeObject.userData.rigidBody);
            mylib2020.removeAmmoRigidBody(threeObject);
            mylib2020.removeAmmoShapeRecursive(threeObject);
        }
    }

    /**
     * 物理エンジンと 3D シーンから物体を削除する。
     * @param {THREE.Object3D} threeObject 
     */
    remove(threeObject) {
        this.removePhysics(threeObject);
        this.targetObjects.delete(threeObject);
        this.scene.remove(threeObject);
    }

    /**
     * 全ての物体をシーンと物理エンジンから削除する。
     */
    clear() {
        for (let obj of this.targetObjects) {
            this.removePhysicsRecursive(obj);
            this.scene.remove(threeObject);
        }
        this.targetObjects.clear();
    }

    destroy() {
        this.clear();
        this.collisionBuilder.destroy();
        this.rigidBodyPose.destroy();
        Ammo.destroy(this.transform);
        Ammo.destroy(this.world);
        Ammo.destroy(this.dispatcher);
        Ammo.destroy(this.overlappingPairCache);
        Ammo.destroy(this.solver);
        Ammo.destroy(this.collisionConfiguration);
    }
};

/**
 * Ammo の衝突検出形状や剛体（形状が変化しない物体）を生成する。
 */
mylib2020.AmmoCollisionBuilder = class {
    constructor() {
        this.position = new Ammo.btVector3();
        this.rotation = new Ammo.btQuaternion();
        this.transform = new Ammo.btTransform();
        this.localInertia = new Ammo.btVector3();
        this.size = new Ammo.btVector3();
        this.scale = new Ammo.btVector3();
        this.factor = new Ammo.btVector3();
        this.vertex = new Ammo.btVector3();
        this.minLength = 0.01;
        this.collisionShapeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
    }

    /**
     * 基本的な形状を geometry に持つ threeObject に対して同じ大きさの衝突検出範囲を生成し、threeObject.userData.collisionShape に代入する。<br/>
     * さらに、その形状に基づく剛体を生成して threeObject.userData.rigidBody に代入する。<br/>
     * @param {THREE.Object3D} threeObject Three.js の物体。
     * 対応する形状は次の通り。 threeObject.geometry が下記のいずれかでなければならない。
     * <ul>
     *   <li>THREE.PlaneGeometry</li>
     *   <li>THREE.BoxGeometry</li>
     *   <li>THREE.SphereGeometry</li>
     *   <li>THREE.CylinderGeometry<br/>
     *     <b>※真円かつ、底面と上面が同じ大きさの円柱しか対応していない。つまり、 x, z の scale が等しい必要がある。</b></li>
     *   <li>THREE.ConeGeometry<br/>
     *     <b>※底面が真円の円錐しか対応していない。つまり、 x, z の scale が等しい必要がある。</b></li>
     * </ul>
     * @param {Object} params 次のようなキーでパラメータ指定する。null のとき、デフォルト値が使用される。
     * <ul>
     *   <li>movable - boolean ユーザが動かす予定がある物体は true にする。(デフォルト: false)</li>
     *   <li>mass - number 重さ。単位は Kg (デフォルト: 1)</li>
     *   <li>friction - number 面で接触する物体に対する摩擦。(デフォルト: 0.5)</li>
     *   <li>rollingFriction - number 線や点で接触する、転がる物体に対する摩擦。(デフォルト: 0.1)</li>
     *   <li>restitution - number 反発の程度。(デフォルト: 0)</li>
     *   <li>freezeRotationX - boolean X 軸中心の回転をさせないかどうか。(デフォルト: false)</li>
     *   <li>freezeRotationY - boolean Y 軸中心の回転をさせないかどうか。(デフォルト: false)</li>
     *   <li>linearDamping - number 移動に対する空気抵抗。大きいほど減速しやすい。(デフォルト: 0)</li>
     *   <li>angularDamping - number 回転に対する空気抵抗。大きいほど回転が止まりやすい。(デフォルト: 0)</li>
     *   <li>margin - number 衝突検出範囲に余裕を持たせる場合の距離。(デフォルト: 0.01)</li>
     * </ul>
     * @returns {Ammo.btRigidBody} 生成された剛体。失敗した場合は null が返る。
     */
    addPrimitiveRigidBody(threeObject, params = null) {
        if (this.addPrimitiveShape(threeObject) == null) {
            return null;
        }
        return this.addRigidBody(threeObject, params);
    }
    /**
     * threeObject を包むような直方体の衝突検出範囲を生成し threeObject.userData.collisionShape に代入する。<br/>
     * さらに、その形状に基づく剛体を生成して threeObject.userData.rigidBody に代入する。
     * @param {THREE.Object3D} threeObject Three.js の物体。
     * @param {Object} params 次のようなキーでパラメータ指定する。null のとき、デフォルト値が使用される。
     * <ul>
     *   <li>showCollision - boolean 衝突検知範囲を可視化するか (デフォルト: false)</li>
     *   <li>scale - THREE.Vector3 衝突検知範囲の拡大縮小率 (デフォルト: x, y, z 全て 1.0)</li>
     *   <li>offset - THREE.Vector3 衝突検知範囲の中心からのオフセット (デフォルト: x, y, z 全て 0.0)</li>
     *   <li>movable - boolean ユーザが動かす予定がある物体は true にする。(デフォルト: false)</li>
     *   <li>mass - number 重さ。単位は Kg (デフォルト: 1)</li>
     *   <li>friction - number 面で接触する物体に対する摩擦。(デフォルト: 0.5)</li>
     *   <li>rollingFriction - number 線や点で接触する、転がる物体に対する摩擦。(デフォルト: 0.1)</li>
     *   <li>restitution - number 反発の程度。(デフォルト: 0)</li>
     *   <li>freezeRotationX - boolean X 軸中心の回転をさせないかどうか。(デフォルト: false)</li>
     *   <li>freezeRotationY - boolean Y 軸中心の回転をさせないかどうか。(デフォルト: false)</li>
     *   <li>linearDamping - number 移動に対する空気抵抗。大きいほど減速しやすい。(デフォルト: 0)</li>
     *   <li>angularDamping - number 回転に対する空気抵抗。大きいほど回転が止まりやすい。(デフォルト: 0)</li>
     *   <li>margin - number 衝突検出範囲に余裕を持たせる場合の距離。(デフォルト: 0.01)</li>
     * </ul>
     * @returns {Ammo.btRigidBody} 生成された剛体。失敗した場合は null が返る。
     */
    addBoundingBoxRigidBody(threeObject, params = null) {
        this.addBoundingBoxShape(threeObject, params);
        return this.addRigidBody(threeObject, params);
    }

    /**
     * threeObject を包むような球体の衝突検出範囲を生成し threeObject.userData.collisionShape に代入する。<br/>
     * さらに、その形状に基づく剛体を生成して threeObject.userData.rigidBody に代入する。
     * @param {THREE.Object3D} threeObject Three.js の物体。
     * @param {Object} params 次のようなキーでパラメータ指定する。null のとき、デフォルト値が使用される。
     * <ul>
     *   <li>showCollision - boolean 衝突検知範囲を可視化するか (デフォルト: false)</li>
     *   <li>scale - THREE.Vector3 衝突検知範囲の拡大縮小率 (デフォルト: x, y, z 全て 1.0)</li>
     *   <li>offset - THREE.Vector3 衝突検知範囲の中心からのオフセット (デフォルト: x, y, z 全て 0.0)</li>
     *   <li>movable - boolean ユーザが動かす予定がある物体は true にする。(デフォルト: false)</li>
     *   <li>mass - number 重さ。単位は Kg (デフォルト: 1)</li>
     *   <li>friction - number 面で接触する物体に対する摩擦。(デフォルト: 0.5)</li>
     *   <li>rollingFriction - number 線や点で接触する、転がる物体に対する摩擦。(デフォルト: 0.1)</li>
     *   <li>restitution - number 反発の程度。(デフォルト: 0)</li>
     *   <li>freezeRotationX - boolean X 軸中心の回転をさせないかどうか。(デフォルト: false)</li>
     *   <li>freezeRotationY - boolean Y 軸中心の回転をさせないかどうか。(デフォルト: false)</li>
     *   <li>linearDamping - number 移動に対する空気抵抗。大きいほど減速しやすい。(デフォルト: 0)</li>
     *   <li>angularDamping - number 回転に対する空気抵抗。大きいほど回転が止まりやすい。(デフォルト: 0)</li>
     *   <li>margin - number 衝突検出範囲に余裕を持たせる場合の距離。(デフォルト: 0.01)</li>
     * </ul>
     * @returns {Ammo.btRigidBody} 生成された剛体。失敗した場合は null が返る。
     */
    addBoundingSphereRigidBody(threeObject, params = null) {
        this.addBoundingSphereShape(threeObject, params);
        return this.addRigidBody(threeObject, params);
    }

    /**
     * threeObject を包むような円柱の衝突検出範囲を生成し threeObject.userData.collisionShape に代入する。<br/>
     * <b>※真円かつ、底面と上面が同じ大きさの円柱しか生成しない。</b><br/>
     * さらに、その形状に基づく剛体を生成して threeObject.userData.rigidBody に代入する。
     * @param {THREE.Object3D} threeObject Three.js の物体。
     * @param {Object} params 次のようなキーでパラメータ指定する。null のとき、デフォルト値が使用される。
     * <ul>
     *   <li>showCollision - boolean 衝突検知範囲を可視化するか (デフォルト: false)</li>
     *   <li>axis - string 円柱の中心軸 "x", "y", "z" のいずれか (デフォルト: y)</li>
     *   <li>scale - THREE.Vector3 衝突検知範囲の拡大縮小率 (デフォルト: x, y, z 全て 1.0)</li>
     *   <li>offset - THREE.Vector3 衝突検知範囲の中心からのオフセット (デフォルト: x, y, z 全て 0.0)</li>
     *   <li>movable - boolean ユーザが動かす予定がある物体は true にする。(デフォルト: false)</li>
     *   <li>mass - number 重さ。単位は Kg (デフォルト: 1)</li>
     *   <li>friction - number 面で接触する物体に対する摩擦。(デフォルト: 0.5)</li>
     *   <li>rollingFriction - number 線や点で接触する、転がる物体に対する摩擦。(デフォルト: 0.1)</li>
     *   <li>restitution - number 反発の程度。(デフォルト: 0)</li>
     *   <li>freezeRotationX - boolean X 軸中心の回転をさせないかどうか。(デフォルト: false)</li>
     *   <li>freezeRotationY - boolean Y 軸中心の回転をさせないかどうか。(デフォルト: false)</li>
     *   <li>linearDamping - number 移動に対する空気抵抗。大きいほど減速しやすい。(デフォルト: 0)</li>
     *   <li>angularDamping - number 回転に対する空気抵抗。大きいほど回転が止まりやすい。(デフォルト: 0)</li>
     *   <li>margin - number 衝突検出範囲に余裕を持たせる場合の距離。(デフォルト: 0.01)</li>
     * </ul>
     * @returns {Ammo.btRigidBody}
     */
    addBoundingCylinderRigidBody(threeObject, params = null) {
        this.addBoundingCylinderShape(threeObject, params);
        return this.addRigidBody(threeObject, params);
    }

    /**
     * threeObject とその子に対して衝突検出範囲を設定し、それらを結合ものを threeObject.userData.collisionShape に代入する。<br/>
     * さらに、その形状に基づく剛体を生成して threeObject.userData.rigidBody に代入する。<br/>
     * 子が userData.collisionShape を既に持っていればそれを衝突検出範囲として使う。
     * 無い場合、子に対し addPrimitiveShape が使用され、失敗した場合は範囲設定しない。また、子が geometry を持っていない場合も衝突検出範囲を生成しない。
     * @param {Object} params 次のようなキーでパラメータ指定する。null のとき、デフォルト値が使用される。
     * <ul>
     *   <li>movable - boolean ユーザが動かす予定がある物体は true にする。(デフォルト: false)</li>
     *   <li>mass - number 重さ。単位は Kg (デフォルト: 1)</li>
     *   <li>friction - number 面で接触する物体に対する摩擦。(デフォルト: 0.5)</li>
     *   <li>rollingFriction - number 線や点で接触する、転がる物体に対する摩擦。(デフォルト: 0.1)</li>
     *   <li>restitution - number 反発の程度。(デフォルト: 0)</li>
     *   <li>freezeRotationX - boolean X 軸中心の回転をさせないかどうか。(デフォルト: false)</li>
     *   <li>freezeRotationY - boolean Y 軸中心の回転をさせないかどうか。(デフォルト: false)</li>
     *   <li>linearDamping - number 移動に対する空気抵抗。大きいほど減速しやすい。(デフォルト: 0)</li>
     *   <li>angularDamping - number 回転に対する空気抵抗。大きいほど回転が止まりやすい。(デフォルト: 0)</li>
     *   <li>margin - number 衝突検出範囲に余裕を持たせる場合の距離。(デフォルト: 0.01)</li>
     * </ul>
     * @returns {Ammo.btRigidBody} 生成された剛体。失敗した場合は null が返る。
     */
    addCompoundRigidBody(threeObject, params = null) {
        this.addCompoundShape(threeObject);
        return this.addRigidBody(threeObject, params);
    }

    /**
     * Three.js の基本的な形状と同じ大きさの衝突検出範囲を生成し、threeObject.userData.collisionShape に代入する。<br/>
     * 対応する形状は次の通り。 threeObject.geometry が下記のいずれかでなければならない。
     * <ul>
     *   <li>THREE.PlaneGeometry</li>
     *   <li>THREE.BoxGeometry</li>
     *   <li>THREE.SphereGeometry</li>
     *   <li>THREE.CylinderGeometry<br/>
     *     <b>※真円かつ、底面と上面が同じ大きさの円柱しか対応していない。つまり、 x, z の scale が等しい必要がある。</b></li>
     *   <li>THREE.ConeGeometry<br/>
     *     <b>※底面が真円の円錐しか対応していない。つまり、 x, z の scale が等しい必要がある。</b></li>
     * </ul>
     * @author (Set the text for this tag by adding docthis.authorName to your settings file.)
     * @param {THREE.Mesh} threeObject
     * @returns {any} 成功した場合、threeObject.geometry に対応する生成された衝突検出範囲の形状が返る。次のいずれかである。
     * <ul>
     *   <li>THREE.PlaneGeometry -> Ammo.btConvexHullShape</li>
     *   <li>THREE.BoxGeometry -> Ammo.btBoxShape</li>
     *   <li>THREE.SphereGeometry -> Ammo.btMultiSphereShape</li>
     *   <li>THREE.CylinderGeometry -> Ammo.btCylinderShape</li>
     *   <li>THREE.ConeGeometry -> Ammo.btConeShape</li>
     * </ul>
     * 失敗した場合、 null が返る。
     */
    addPrimitiveShape(threeObject) {
        const shape = this.makePrimitiveShape(threeObject);
        if (shape) {
            mylib2020.addAmmoShape(threeObject, shape);
        }
        return shape;
    }

    /**
     * 頂点を包む凸包の衝突検出範囲を生成し threeObject.userData.collisionShape に代入する。
     * @param {THREE.Mesh} threeObject Three.js の物体。
     * @param {Array<THREE.Vector3>} vertices 物体の頂点配列。
     * @param {THREE.Vector3} scale 検出範囲の拡大縮小率。
     * @returns {Ammo.btConvexHullShape}
     */
    addConvexHullShape(threeObject, vertices, scale) {
        const shape = this.makeConvexHullShape(vertices, scale);
        mylib2020.addAmmoShape(threeObject, shape);
        return shape;
    }

    /**
     * threeObject と同じ大きさの平面の衝突検出範囲を生成し threeObject.userData.collisionShape に代入する。<br/>
     * @param {THREE.Mesh} threeObject Three.js の物体。THREE.PlaneGeometry を持つ必要がある。
     * @returns {Ammo.btConvexHullShape}
     */
    addPlaneShape(threeObject) {
        const shape = this.makePlaneShape(threeObject);
        mylib2020.addAmmoShape(threeObject, shape);
        return shape;
    }

    /**
     * threeObject と同じ大きさの直方体の衝突検出範囲を生成し threeObject.userData.collisionShape に代入する。<br/>
     * @param {THREE.Mesh} threeObject Three.js の物体。THREE.BoxGeometry を持つ必要がある。
     * @returns {Ammo.btBoxShape}
     */
    addBoxShape(threeObject) {
        const shape = this.makeBoxShape(threeObject);
        mylib2020.addAmmoShape(threeObject, shape);
        return shape;
    }

    /**
     * threeObject と同じ大きさの球体の衝突検出範囲を生成し threeObject.userData.collisionShape に代入する。<br/>
     * @param {THREE.Mesh} threeObject Three.js の物体。THREE.SphereGeometry を持つ必要がある。
     * @returns {Ammo.btMultiSphereShape}
     */
    addSphereShape(threeObject) {
        const shape = this.makeSphereShape(threeObject);
        mylib2020.addAmmoShape(threeObject, shape);
        return shape;
    }

    /**
     * threeObject と同じ大きさの円柱の衝突検出範囲を生成し threeObject.userData.collisionShape に代入する。<br/>
     * <b>※真円かつ、底面と上面が同じ大きさの円柱しか対応していない。つまり、 x, z の scale が等しい必要がある。</b>
     * @param {THREE.Mesh} threeObject Three.js の物体。THREE.CylinderGeometry を持つ必要がある。
     * @returns {Ammo.btCylinderShape}
     */
    addCylinderShape(threeObject) {
        const shape = this.makeCylinderShape(threeObject);
        mylib2020.addAmmoShape(threeObject, shape);
        return shape;
    }

    /**
     * threeObject と同じ大きさの円錐の衝突検出範囲を生成し threeObject.userData.collisionShape に代入する。<br/>
     * <b>※底面が真円の円錐しか対応していない。つまり、 x, z の scale が等しい必要がある。</b>
     * @param {THREE.Mesh} threeObject Three.js の物体。THREE.ConeGeometry を持つ必要がある。
     * @returns {Ammo.btConeShape}
     */
    addConeShape(threeObject) {
        const shape = this.makeConeShape(threeObject);
        mylib2020.addAmmoShape(threeObject, shape);
        return shape;
    }

    /**
     * threeObject を包むような円柱の衝突検出範囲を生成し threeObject.userData.collisionShape に代入する。<br/>
     * <b>※真円かつ、底面と上面が同じ大きさの円柱しか生成しない。</b>
     * @param {THREE.Object3D} threeObject Three.js の物体。
     * @param {Object} params 次のようなキーでパラメータ指定する。null のとき、デフォルト値が使用される。
     * <ul>
     *   <li>showCollision - boolean 衝突検知範囲を可視化するか (デフォルト: false)</li>
     *   <li>axis - string 円柱の中心軸 "x", "y", "z" のいずれか (デフォルト: y)</li>
     *   <li>scale - THREE.Vector3 衝突検知範囲の拡大縮小率 (デフォルト: x, y, z 全て 1.0)</li>
     *   <li>offset - THREE.Vector3 衝突検知範囲の中心からのオフセット (デフォルト: x, y, z 全て 0.0)</li>
     * </ul>
     * @returns {Ammo.btCompoundShape}
     */
    addBoundingCylinderShape(threeObject, params = null) {
        params = params || {};
        const showCollision = ('showCollision' in params) ? params.showCollision : false;
        const axis = ('axis' in params) ? params.axis.toLowerCase() : "y";
        if (axis != "x" && axis != "y" && axis != "z") {
            axis = "y";
        }
        const scale = ('scale' in params) ? params.scale : new THREE.Vector3(1, 1, 1);
        const offset = ('offset' in params) ? params.offset : new THREE.Vector3(0, 0, 0);

        let radius = 0;
        let height = 0;
        let rotation = new THREE.Vector3();
        const bbox = this.calcBoundingBox(threeObject, scale, offset);
        if (axis == "x") {
            height = bbox.size.x;
            radius = Math.max(bbox.size.y, bbox.size.z) / 2;
            rotation.z = THREE.Math.degToRad(90);
        } else if (axis == "y") {
            height = bbox.size.y;
            radius = Math.max(bbox.size.x, bbox.size.z) / 2;
        } else if (axis == "z") {
            height = bbox.size.z;
            radius = Math.max(bbox.size.x, bbox.size.y) / 2;
            rotation.x = THREE.Math.degToRad(90);
        }

        const geom = new THREE.CylinderGeometry(radius, radius, height, 8);
        const childMesh = new THREE.Mesh(geom, this.collisionShapeMaterial.clone());
        if (showCollision == false) {
            childMesh.material.transparent = true;
            childMesh.material.opacity = 0.0;
        }
        childMesh.name = threeObject.name + "_BCYLINDER";
        childMesh.rotation.set(rotation.x, rotation.y, rotation.z);
        childMesh.position.set(bbox.center.x, bbox.center.y, bbox.center.z);
        threeObject.add(childMesh);
        return this.addCompoundShape(threeObject);
    }

    /**
     * threeObject を包むような球体の衝突検出範囲を生成し threeObject.userData.collisionShape に代入する。
     * @param {THREE.Object3D} threeObject Three.js の物体。
     * @param {Object} params 次のようなキーでパラメータ指定する。null のとき、デフォルト値が使用される。
     * <ul>
     *   <li>showCollision - boolean 衝突検知範囲を可視化するか (デフォルト: false)</li>
     *   <li>scale - THREE.Vector3 衝突検知範囲の拡大縮小率 (デフォルト: x, y, z 全て 1.0)</li>
     *   <li>offset - THREE.Vector3 衝突検知範囲の中心からのオフセット (デフォルト: x, y, z 全て 0.0)</li>
     * </ul>
     * @returns {Ammo.btCompoundShape}
     */
    addBoundingSphereShape(threeObject, params = null) {
        params = params || {};
        const showCollision = ('showCollision' in params) ? params.showCollision : false;
        const scale = ('scale' in params) ? params.scale : new THREE.Vector3(1, 1, 1);
        const offset = ('offset' in params) ? params.offset : new THREE.Vector3(0, 0, 0);

        const bbox = this.calcBoundingBox(threeObject, scale, offset);
        const geom = new THREE.SphereGeometry(0.5, 8, 8);
        const childMesh = new THREE.Mesh(geom, this.collisionShapeMaterial.clone());
        if (showCollision == false) {
            childMesh.material.transparent = true;
            childMesh.material.opacity = 0.0;
        }
        childMesh.scale.set(bbox.size.x, bbox.size.y, bbox.size.z);
        childMesh.name = threeObject.name + "_BSPHERE";
        childMesh.position.set(bbox.center.x, bbox.center.y, bbox.center.z);
        threeObject.add(childMesh);
        return this.addCompoundShape(threeObject);
    }

    /**
     * threeObject を包むような直方体の衝突検出範囲を生成し threeObject.userData.collisionShape に代入する。
     * @param {THREE.Object3D} threeObject Three.js の物体。
     * @param {Object} params 次のようなキーでパラメータ指定する。null のとき、デフォルト値が使用される。
     * <ul>
     *   <li>showCollision - boolean 衝突検知範囲を可視化するか (デフォルト: false)</li>
     *   <li>scale - THREE.Vector3 衝突検知範囲の拡大縮小率 (デフォルト: x, y, z 全て 1.0)</li>
     *   <li>offset - THREE.Vector3 衝突検知範囲の中心からのオフセット (デフォルト: x, y, z 全て 0.0)</li>
     * </ul>
     * @returns {Ammo.btCompoundShape}
     */
    addBoundingBoxShape(threeObject, params = null) {
        params = params || {};
        const showCollision = ('showCollision' in params) ? params.showCollision : false;
        const scale = ('scale' in params) ? params.scale : new THREE.Vector3(1, 1, 1);
        const offset = ('offset' in params) ? params.offset : new THREE.Vector3(0, 0, 0);

        const bbox = this.calcBoundingBox(threeObject, scale, offset);
        const geom = new THREE.BoxGeometry(bbox.size.x, bbox.size.y, bbox.size.z);
        const childMesh = new THREE.Mesh(geom, this.collisionShapeMaterial.clone());
        if (showCollision == false) {
            childMesh.material.transparent = true;
            childMesh.material.opacity = 0.0;
        }
        childMesh.name = threeObject.name + "_BBOX";
        childMesh.position.set(bbox.center.x, bbox.center.y, bbox.center.z);
        threeObject.add(childMesh);
        return this.addCompoundShape(threeObject);
    }

    /**
     * 子を持つ threeObject に対し全ての子が持つ衝突検出範囲を結合して threeObject.userData.collisionShape に代入する。<br/>
     * 子が userData.collisionShape を既に持っていればそれを衝突検出範囲として使う。
     * 無い場合、子に対し addPrimitiveShape が使用され、失敗した場合は範囲設定はされない。
     * 子が geometry を持っていない場合は衝突検出範囲を生成しない。
     * @param {THREE.Object3D} threeObject 子を持つ Three.js の物体。
     * @returns {Ammo.btCompoundShape}
     */
    addCompoundShape(threeObject) {
        let shape = new Ammo.btCompoundShape();
        if (threeObject.geometry && !threeObject.userData.collisionShape) {
            this.addPrimitiveShape(threeObject);
        }
        if (threeObject.userData.collisionShape) {
            threeObject.userData.collisionShapeOrg = threeObject.userData.collisionShape;
            this.transform.setIdentity();
            shape.addChildShape(this.transform, threeObject.userData.collisionShapeOrg);
        }
        for (let child of threeObject.children) {
            const childShape = this.addCompoundShape(child);
            if (childShape) {
                this.position.setValue(child.position.x, child.position.y, child.position.z);
                this.rotation.setValue(child.quaternion.x, child.quaternion.y, child.quaternion.z, child.quaternion.w);
                this.transform.setIdentity();
                this.transform.setOrigin(this.position);
                this.transform.setRotation(this.rotation);
                shape.addChildShape(this.transform, childShape);
            }
        }
        if (shape.getNumChildShapes() > 0) {
            threeObject.userData.collisionShape = shape;
        } else {
            Ammo.destroy(shape);
            shape = null;
        }
        return shape;
    }

    /**
     * threeObject.userData.collisionShape に衝突検出範囲を持つ threeObject に対し剛体を生成して threeObject.userData.rigidBody に代入する。<br/>
     * threeObject が threeObject.userData.collisionShape に衝突検出範囲を持っていなければ何もしない。
     * @param {THREE.Object3D} threeObject Three.js の物体。
     * @param {Object} params 次のようなキーでパラメータ指定する。null のとき、デフォルト値が使用される。
     * <ul>
     *   <li>movable - boolean ユーザが動かす予定がある物体は true にする。(デフォルト: false)</li>
     *   <li>mass - number 重さ。単位は Kg (デフォルト: 1)</li>
     *   <li>friction - number 面で接触する物体に対する摩擦。(デフォルト: 0.5)</li>
     *   <li>rollingFriction - number 線や点で接触する、転がる物体に対する摩擦。(デフォルト: 0.1)</li>
     *   <li>restitution - number 反発の程度。(デフォルト: 0)</li>
     *   <li>freezeRotationX - boolean X 軸中心の回転をさせないかどうか。(デフォルト: false)</li>
     *   <li>freezeRotationY - boolean Y 軸中心の回転をさせないかどうか。(デフォルト: false)</li>
     *   <li>linearDamping - number 移動に対する空気抵抗。大きいほど減速しやすい。(デフォルト: 0)</li>
     *   <li>angularDamping - number 回転に対する空気抵抗。大きいほど回転が止まりやすい。(デフォルト: 0)</li>
     *   <li>margin - number 衝突検出範囲に余裕を持たせる場合の距離。(デフォルト: 0.01)</li>
     * </ul>
     * @returns {Ammo.btRigidBody} 生成された剛体。失敗した場合は null が返る。
     */
    addRigidBody(threeObject, params = null) {
        if (threeObject.userData.collisionShape) {
            const rigidBody = this.makeRigidBody(threeObject.position, threeObject.quaternion, threeObject.userData.collisionShape, params);
            mylib2020.addAmmoRigidBody(threeObject, rigidBody);
            this.checkMovable(threeObject, params);
            return rigidBody;
        }
        return null;
    }

    // Shape 作成系
    makePrimitiveShape(threeObject) {
        if (!threeObject.geometry || !threeObject.geometry.type) {
            return null;
        }
        if (threeObject.geometry.type === "PlaneGeometry") {
            return this.makePlaneShape(threeObject);
        } else if (threeObject.geometry.type === "BoxGeometry") {
            return this.makeBoxShape(threeObject);
        } else if (threeObject.geometry.type === "SphereGeometry") {
            return this.makeSphereShape(threeObject);
        } else if (threeObject.geometry.type === "CylinderGeometry") {
            return this.makeCylinderShape(threeObject);
        } else if (threeObject.geometry.type === "ConeGeometry") {
            return this.makeConeShape(threeObject);
        }
        return null;
    }

    makeConvexHullShape(vertices, scale) {
        const shape = new Ammo.btConvexHullShape();
        for (let v of vertices) {
            this.vertex.setValue(v.x, v.y, v.z);
            shape.addPoint(this.vertex);
        }
        this.scale.setValue(scale.x, scale.y, scale.z);
        shape.setLocalScaling(this.scale);
        return shape;
    }

    makePlaneShape(threeObject) {
        const geometryParams = threeObject.geometry.parameters;
        const w2 = geometryParams.width / 2; // X
        const h2 = geometryParams.height / 2; // Y
        const vertices = [
            new THREE.Vector3(-w2, -h2, 0),
            new THREE.Vector3(w2, -h2, 0),
            new THREE.Vector3(w2, h2, 0),
            new THREE.Vector3(-w2, h2, 0)
        ];
        return this.makeConvexHullShape(vertices, threeObject.scale);
    }

    makeBoxShape(threeObject) {
        threeObject.geometry.computeBoundingBox();
        const bbox = threeObject.geometry.boundingBox;
        const x = Math.max(this.minLength, Math.abs(bbox.max.x - bbox.min.x));
        const y = Math.max(this.minLength, Math.abs(bbox.max.y - bbox.min.y));
        const z = Math.max(this.minLength, Math.abs(bbox.max.z - bbox.min.z));
        this.size.setValue(x * 0.5, y * 0.5, z * 0.5);
        this.scale.setValue(threeObject.scale.x, threeObject.scale.y, threeObject.scale.z);
        const shape = new Ammo.btBoxShape(this.size);
        shape.setLocalScaling(this.scale);
        return shape;
    }

    makeSphereShape(threeObject) {
        threeObject.geometry.computeBoundingSphere();
        const sphere = threeObject.geometry.boundingSphere;
        this.position.setValue(0, 0, 0);
        this.scale.setValue(threeObject.scale.x, threeObject.scale.y, threeObject.scale.z);
        const shape = new Ammo.btMultiSphereShape([this.position], [sphere.radius], 1);
        shape.setLocalScaling(this.scale);
        return shape;
    }

    makeCylinderShape(threeObject) {
        threeObject.geometry.computeBoundingBox();
        const bbox = threeObject.geometry.boundingBox;
        const x = Math.max(this.minLength, Math.abs(bbox.max.x - bbox.min.x));
        const y = Math.max(this.minLength, Math.abs(bbox.max.y - bbox.min.y)); // Height
        const z = Math.max(this.minLength, Math.abs(bbox.max.z - bbox.min.z));
        const radius = Math.max(x, z) / 2;
        this.size.setValue(radius, y * 0.5, radius);
        this.scale.setValue(threeObject.scale.x, threeObject.scale.y, threeObject.scale.z);
        const shape = new Ammo.btCylinderShape(this.size);
        shape.setLocalScaling(this.scale);
        return shape;
    }

    makeConeShape(threeObject) {
        const geometryParams = threeObject.geometry.parameters;
        const radius = geometryParams.radius;
        const height = geometryParams.height;
        const shape = new Ammo.btConeShape(radius, height);
        this.scale.setValue(threeObject.scale.x, threeObject.scale.y, threeObject.scale.z);
        shape.setLocalScaling(this.scale);
        return shape;
    }

    // ヘルパー
    checkMovable(threeObject, params = null) {
        params = params || {};
        threeObject.userData.movable = ('movable' in params) ? params.movable : false;
        if (threeObject.userData.movable) {
            threeObject.userData.linearVelocity = 0;
            threeObject.userData.angularVelocity = 0;
        }
    }

    /**
     * threeObject を包むような直方体の大きさとローカル中心座標を計算する。
     * @param {THREE.Object3D} threeObject Three.js の物体。
     * @param {THREE.Vector3} scale 直方体の拡大縮小率。
     * @param {THREE.Vector3} offset 直方体の中心に加算する値。
     * @returns {Object} 
     * <ul>
     *   <li>size - 大きさ {x, y, z}</li>
     *   <li>center - THREE.Vector3</li>
     * </ul>
     */
    calcBoundingBox(threeObject, scale, offset) {
        const bbox = new THREE.Box3();
        const center = new THREE.Vector3();
        bbox.setFromObject(threeObject);
        bbox.getCenter(center);
        threeObject.worldToLocal(center);
        const x = Math.max(this.minLength, Math.abs(bbox.max.x - bbox.min.x)) * scale.x;
        const y = Math.max(this.minLength, Math.abs(bbox.max.y - bbox.min.y)) * scale.y;
        const z = Math.max(this.minLength, Math.abs(bbox.max.z - bbox.min.z)) * scale.z;
        center.add(offset);
        return { size: { x, y, z }, center: center };
    }

    // 剛体生成
    makeRigidBody(pos, quat, shape, params = null) {
        params = params || {};
        const mass = ('mass' in params) ? params.mass : 1;
        const friction = ('friction' in params) ? params.friction : 0.5;
        const rollingFriction = ('rollingFriction' in params) ? params.rollingFriction : 0.0;
        const restitution = ('restitution' in params) ? params.restitution : 0;
        const kinematic = ('kinematic' in params) ? params.kinematic : false;
        const freezeRotationX = ('freezeRotationX' in params) ? params.freezeRotationX : false;
        const freezeRotationY = ('freezeRotationY' in params) ? params.freezeRotationY : false;
        const freezeRotationZ = ('freezeRotationZ' in params) ? params.freezeRotationZ : false;
        const linearDamping = ('linearDamping' in params) ? params.linearDamping : 0;
        const angularDamping = ('angularDamping' in params) ? params.angularDamping : 0;

        const margin = ('margin' in params) ? params.margin : 0.01;
        shape.setMargin(margin);
        this.localInertia.setValue(0, 0, 0);
        shape.calculateLocalInertia(mass, this.localInertia);

        this.position.setValue(pos.x, pos.y, pos.z);
        this.rotation.setValue(quat.x, quat.y, quat.z, quat.w);
        this.transform.setIdentity();
        this.transform.setOrigin(this.position);
        this.transform.setRotation(this.rotation);
        const motionState = new Ammo.btDefaultMotionState(this.transform);
        const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, this.localInertia);
        const rigidBody = new Ammo.btRigidBody(rbInfo);
        rigidBody.setRollingFriction(rollingFriction);
        rigidBody.setFriction(friction);
        rigidBody.setRestitution(restitution);
        rigidBody.setDamping(linearDamping, angularDamping);
        if (kinematic) {
            rigidBody.setActivationState(Ammo.DISABLE_DEACTIVATION);
            rigidBody.setCollisionFlags(rigidBody.getCollisionFlags() | Ammo.CF_KINEMATIC_OBJECT);
        }
        if (freezeRotationX || freezeRotationY || freezeRotationZ) {
            this.factor.setValue(1, 1, 1);
            if (freezeRotationX) {
                this.factor.setX(0);
            }
            if (freezeRotationY) {
                this.factor.setY(0);
            }
            if (freezeRotationZ) {
                this.factor.setZ(0);
            }
            rigidBody.setAngularFactor(this.factor);
        }
        Ammo.destroy(rbInfo);
        return rigidBody;
    }

    destroy() {
        Ammo.destroy(this.position);
        Ammo.destroy(this.rotation);
        Ammo.destroy(this.transform);
        Ammo.destroy(this.localInertia);
        Ammo.destroy(this.size);
        Ammo.destroy(this.scale);
        Ammo.destroy(this.factor);
        Ammo.destroy(this.vertex);
    }
};

/**
 * 物体同士の衝突を管理する。
 */
mylib2020.AmmoCollisionManager = class {
    constructor() {
        this.newCollisions = new Map();
        this.all = new Map();
        this.enter = new Map();
        this.stay = new Map();
        this.exit = new Map();
    }

    /**
     * 今回のフレームで接触している全ての物体を得る。for(let object of ...)で個々の物体にアクセス可能。
     * @returns {Iterator} of を使って for 文でアクセスできる。
     * @example 
     * for (let object of target.userData.collision.getAll()) {
     *     // target と接触している個々の物体を参照できる。
     * }
     */
    getAll() {
        return this.all.keys();
    }

    /**
     * 今回のフレームで接触を開始した全ての物体を得る。for(let object of ...)で個々の物体にアクセス可能。
     * @returns {Iterator} of を使って for 文でアクセスできる。
     * @example 
     * for (let object of target.userData.collision.getEnter()) {
     *     // target と接触を開始した個々の物体を参照できる。
     * }
     */
    getEnter() {
        return this.enter.keys();
    }

    /**
     * 今回のフレームで接触を終了した全ての物体を得る。for(let object of ...)で個々の物体にアクセス可能。
     * @returns {Iterator} of を使って for 文でアクセスできる。
     * @example 
     * for (let object of target.userData.collision.getExit()) {
     *     // target と接触を終了した個々の物体を参照できる。
     * }
     */
    getExit() {
        return this.exit.keys();
    }

    /**
     * 前回のフレームから接触を継続している全ての物体を得る。for(let object of ...)で個々の物体にアクセス可能。
     * @returns {Iterator} of を使って for 文でアクセスできる。
     * @example 
     * for (let object of target.userData.collision.getStay()) {
     *     // target と接触を継続している個々の物体を参照できる。
     * }
     */
    getStay() {
        return this.stay.keys();
    }

    collisionData() {
        return { sourceContactPoints: [], targetContactPoints: [] };
    }

    addNewCollision(targetThreeObject) {
        if (!this.newCollisions.has(targetThreeObject)) {
            this.newCollisions.set(targetThreeObject, this.collisionData());
        }
    }

    update() {
        this.enter.clear();
        this.stay.clear();
        for (let k of this.newCollisions.keys()) {
            if (this.all.has(k)) {
                this.stay.set(k, this.newCollisions[k]);
                this.all.delete(k);
            } else {
                this.enter.set(k, this.newCollisions[k]);
            }
        }
        this.exit = this.all;
        this.all = this.newCollisions;
        this.newCollisions = new Map();
    }
};

/**
 * Ammo.btRigidBody の位置、姿勢を設定する。
 */
mylib2020.AmmoRigidBodyPose = class {
    constructor() {
        this.position = new Ammo.btVector3();
        this.quaternion = new Ammo.btQuaternion();
        this.transform = new Ammo.btTransform();
        this.ACTIVE_TAG = 1;
    }

    /**
     * Ammo.btRigidBody の位置、姿勢を設定する。
     * @param {Ammo.btRigidBody} rigidBody 設定対象。
     * @param {THREE.Vector3} position 位置。
     * @param {THREE.Quaternion} quaternion 姿勢。
     */
    set(rigidBody, position, quaternion) {
        this.position.setValue(position.x, position.y, position.z);
        this.quaternion.setValue(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
        this.transform.setIdentity();
        this.transform.setOrigin(this.position);
        this.transform.setRotation(this.quaternion);
        const motionState = new Ammo.btDefaultMotionState(this.transform);
        Ammo.destroy(rigidBody.getMotionState());
        rigidBody.forceActivationState(this.ACTIVE_TAG);
        rigidBody.activate();
        rigidBody.setMotionState(motionState);
    }

    /**
     * threeObject の位置、姿勢を threeObject.userData.rigidBody にある Ammo.btRigidBody に反映させる。
     * @param {THREE.Object3D} threeObject threeObject.userData.rigidBody に Ammo.btRigidBody を持っている THREE.Object3D。
     */
    synch(threeObject) {
        if (threeObject.userData.rigidBody) {
            this.set(threeObject.userData.rigidBody, threeObject.position, threeObject.quaternion);
        }
    }

    destroy() {
        Ammo.destroy(this.position);
        Ammo.destroy(this.quaternion);
        Ammo.destroy(this.transform);
    }
};

mylib2020.initAmmo = function (gravity) {
    const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
    const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
    const overlappingPairCache = new Ammo.btDbvtBroadphase();
    const solver = new Ammo.btSequentialImpulseConstraintSolver();
    const world = new Ammo.btDiscreteDynamicsWorld(
        dispatcher,
        overlappingPairCache,
        solver,
        collisionConfiguration
    );
    const gv = new Ammo.btVector3(gravity.x, gravity.y, gravity.z);
    world.setGravity(gv);
    Ammo.destroy(gv);
    return [world, dispatcher, overlappingPairCache, solver, collisionConfiguration];
};

mylib2020.addAmmoRigidBody = function (threeObject, rigidBody) {
    mylib2020.removeAmmoRigidBody(threeObject);
    threeObject.userData.rigidBody = rigidBody;
    rigidBody.threeObject = threeObject;
};

mylib2020.removeAmmoRigidBody = function (threeObject) {
    if (threeObject.userData.rigidBody) {
        if (threeObject.userData.rigidBody.threeObject) {
            delete threeObject.userData.rigidBody.threeObject;
        }
        Ammo.destroy(threeObject.userData.rigidBody.getMotionState());
        Ammo.destroy(threeObject.userData.rigidBody);
        delete threeObject.userData.rigidBody;
    }
};

mylib2020.addAmmoShape = function (threeObject, shape) {
    mylib2020.removeAmmoShape(threeObject);
    threeObject.userData.collisionShape = shape;
};

mylib2020.removeAmmoShapeRecursive = function (threeObject) {
    mylib2020.removeAmmoShape(threeObject);
    for (let child of threeObject.children) {
        mylib2020.removeAmmoShapeRecursive(child);
    }
};

mylib2020.removeAmmoShape = function (threeObject) {
    if (threeObject.userData.collisionShape) {
        Ammo.destroy(threeObject.userData.collisionShape);
        delete threeObject.userData.collisionShape;
    }
    if (threeObject.userData.collisionShapeOrg) {
        Ammo.destroy(threeObject.userData.collisionShapeOrg);
        delete threeObject.userData.collisionShapeOrg;
    }
};

mylib2020.addImpulse = function (rigidBody, impulse = new THREE.Vector3(0, 0, 0)) {
    const imp = new Ammo.btVector3(impulse.x, impulse.y, impulse.z);
    rigidBody.applyCentralImpulse(imp);
    Ammo.destroy(imp);
};

mylib2020.addForce = function (rigidBody, force = new THREE.Vector3(0, 0, 0)) {
    const f = new Ammo.btVector3(force.x, force.y, force.z);
    rigidBody.applyCentralForce(f);
    Ammo.destroy(f);
};

mylib2020.applyAmmo = function (threeObject, rigidBody, btTransformBuffer) {
    rigidBody.getMotionState().getWorldTransform(btTransformBuffer);
    const p = btTransformBuffer.getOrigin();
    const q = btTransformBuffer.getRotation();
    threeObject.position.set(p.x(), p.y(), p.z());
    threeObject.quaternion.set(q.x(), q.y(), q.z(), q.w());
};
