var mylib2020 = mylib2020 || {};

mylib2020.tmpTrans = null;

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
}

mylib2020.createAmmoRigidBody = function (pos, quat, colShape, params = null) {
    params = params || {};
    const mass = ('mass' in params) ? params.mass : 1;
    const friction = ('friction' in params) ? params.friction : 0.5;
    const rollingFriction = ('rollingFriction' in params) ? params.friction : 0.1;
    const restitution = ('restitution' in params) ? params.restitution : 0;
    const margin = ('margin' in params) ? params.margin : 0.01;

    const position = new Ammo.btVector3(pos.x, pos.y, pos.z);
    const rotation = new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w);
    const transform = new Ammo.btTransform();
    const localInertia = new Ammo.btVector3(0, 0, 0);

    transform.setIdentity();
    transform.setOrigin(position);
    transform.setRotation(rotation);
    const motionState = new Ammo.btDefaultMotionState(transform);

    colShape.setMargin(margin);
    colShape.calculateLocalInertia(mass, localInertia);
    const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
    const rigidBody = new Ammo.btRigidBody(rbInfo);
    rigidBody.setRollingFriction(rollingFriction);
    rigidBody.setFriction(friction);
    rigidBody.setRestitution(restitution);

    Ammo.destroy(position);
    Ammo.destroy(rotation);
    Ammo.destroy(transform);
    Ammo.destroy(localInertia);
    Ammo.destroy(rbInfo);
    return rigidBody;
}

mylib2020.destroyAmmoRigidBody = function (rigidBody) {
    if (rigidBody.threeObject) {
        delete rigidBody.threeObject;
    }
    Ammo.destroy(rigidBody.getCollisionShape());
    Ammo.destroy(rigidBody.getMotionState());
    Ammo.destroy(rigidBody);
}

mylib2020.removeAmmoRigidBody = function (threeObject) {
    if (threeObject.userData.rigidBody) {
        mylib2020.destroyAmmoRigidBody(threeObject.userData.rigidBody);
        delete threeObject.userData.rigidBody;
    }
}

mylib2020.createAmmoConvexHull = function (vertices, position, quaternion, scale, params = null) {
    const colShape = new Ammo.btConvexHullShape();
    const tmp = new Ammo.btVector3();
    for (let v of vertices) {
        tmp.setValue(v.x, v.y, v.z);
        colShape.addPoint(tmp);
    }
    const btScale = new Ammo.btVector3(scale.x, scale.y, scale.z);
    colShape.setLocalScaling(btScale);
    const rigidBody = mylib2020.createAmmoRigidBody(position, quaternion, colShape, params);

    Ammo.destroy(tmp);
    Ammo.destroy(btScale);
    return rigidBody;
}

mylib2020.createAmmoPlane = function (threeObject, params = null) {
    const geometryParams = threeObject.geometry.parameters;
    const w2 = geometryParams.width / 2; // X
    const h2 = geometryParams.height / 2; // Y
    const vertices = [
        new THREE.Vector3(-w2, -h2, 0),
        new THREE.Vector3(w2, -h2, 0),
        new THREE.Vector3(w2, h2, 0),
        new THREE.Vector3(-w2, h2, 0)
    ];
    return mylib2020.createAmmoConvexHull(vertices, threeObject.position,
        threeObject.quaternion, threeObject.scale, params);
}

mylib2020.createAmmoBox = function (threeObject, params = null) {
    params = params || {};
    const minLength = ('minLength' in params) ? params.minLength : 0.01;

    threeObject.geometry.computeBoundingBox();
    const bbox = threeObject.geometry.boundingBox;
    const x = Math.max(minLength, Math.abs(bbox.max.x - bbox.min.x));
    const y = Math.max(minLength, Math.abs(bbox.max.y - bbox.min.y));
    const z = Math.max(minLength, Math.abs(bbox.max.z - bbox.min.z));
    const size = new Ammo.btVector3(x * 0.5, y * 0.5, z * 0.5);
    const scale = new Ammo.btVector3(threeObject.scale.x, threeObject.scale.y, threeObject.scale.z);
    const colShape = new Ammo.btBoxShape(size);
    colShape.setLocalScaling(scale);

    const rigidBody = mylib2020.createAmmoRigidBody(threeObject.position, threeObject.quaternion, colShape, params);

    Ammo.destroy(size);
    Ammo.destroy(scale);
    return rigidBody;
}

mylib2020.createAmmoSphere = function (threeObject, params = null) {
    threeObject.geometry.computeBoundingSphere();
    const sphere  = threeObject.geometry.boundingSphere;
    const radius = sphere.radius;
    const position = new Ammo.btVector3(0, 0, 0);
    const scale = new Ammo.btVector3(threeObject.scale.x, threeObject.scale.y, threeObject.scale.z);
    const colShape = new Ammo.btMultiSphereShape([position], [radius], 1);
    colShape.setLocalScaling(scale);

    rigidBody = mylib2020.createAmmoRigidBody(threeObject.position, threeObject.quaternion, colShape, params);

    Ammo.destroy(scale);
    Ammo.destroy(position);
    return rigidBody;
}

mylib2020.createAmmoCylinder = function (threeObject, params = null) {
    params = params || {};
    const minLength = ('minLength' in params) ? params.minLength : 0.01;
    threeObject.geometry.computeBoundingBox();
    const bbox = threeObject.geometry.boundingBox;
    const x = Math.max(minLength, Math.abs(bbox.max.x - bbox.min.x));
    const height = Math.max(minLength, Math.abs(bbox.max.y - bbox.min.y));
    const z = Math.max(minLength, Math.abs(bbox.max.z - bbox.min.z));

    const radius = Math.max(x, z);
    const size = new Ammo.btVector3(radius, height * 0.5, radius);
    const scale = new Ammo.btVector3(threeObject.scale.x, threeObject.scale.y, threeObject.scale.z);
    const colShape = new Ammo.btCylinderShape(size);
    colShape.setLocalScaling(scale);

    rigidBody = mylib2020.createAmmoRigidBody(threeObject.position, threeObject.quaternion, colShape, params);

    Ammo.destroy(size);
    Ammo.destroy(scale);
    return rigidBody;
}


mylib2020.createAmmoCone = function (threeObject, params = null) {
    const geometryParams = threeObject.geometry.parameters;
    const radius = geometryParams.radius;
    const height = geometryParams.height;
    const scale = new Ammo.btVector3(threeObject.scale.x, threeObject.scale.y, threeObject.scale.z);
    const colShape = new Ammo.btConeShape(radius, height);
    colShape.setLocalScaling(scale);

    rigidBody = mylib2020.createAmmoRigidBody(threeObject.position, threeObject.quaternion, colShape, params);

    Ammo.destroy(scale);
    return rigidBody;
}

mylib2020.addAmmoRigidBody = function (threeObject, rigidBody) {
    threeObject.userData.rigidBody = rigidBody;
    rigidBody.threeObject = threeObject;
}

mylib2020.applyAmmo = function (threeObject, rigidBody) {
    if (!mylib2020.tmpTrans) {
        mylib2020.tmpTrans = new Ammo.btTransform();
    }
    const tmpTrans = mylib2020.tmpTrans;
    rigidBody.getMotionState().getWorldTransform(tmpTrans);
    const p = tmpTrans.getOrigin();
    const q = tmpTrans.getRotation();
    threeObject.position.set(p.x(), p.y(), p.z());
    threeObject.quaternion.set(q.x(), q.y(), q.z(), q.w());
}

mylib2020.AmmoCollisionList = class {
    constructor() {
        this.list = {};
    }

    clear() {
        this.list = {};
    }

    addCollisionPair(threeObject1, threeObject2) {
        let data = this.getCollisionData(threeObject1);
        if (!data) {
            data = this.addCollisionData(threeObject1);
        }
        if (data.targetSet.has(threeObject2) == false) {
            data.targetSet.add(threeObject2);
        }
    }

    addCollisionPairCross(threeObject1, threeObject2) {
        this.addCollisionPair(threeObject1, threeObject2);
        this.addCollisionPair(threeObject2, threeObject1);
    }

    checkCollision(threeObject1, threeObject2) {
        let targets = this.getCollisionTargets(threeObject1);
        return targets.has(threeObject2);
    }

    getCollisionTargets(threeObject) {
        const pair = this.getCollisionData(threeObject);
        if (pair) {
            return pair.targetSet;
        }
        return new Set();
    }

    getCollisionData(threeObject) {
        return this.list[threeObject.id];
    }

    addCollisionData(threeObject) {
        const data = { source: threeObject, targetSet: new Set() };
        this.list[threeObject.id] = data;
        return data;
    }
}
mylib2020.AmmoManager = class {
    constructor(scene, gravity = { x: 0, y: -9.8, z: 0 }, subStep = 1) {
        this.scene = scene;
        [this.world, this.dispatcher, this.overlappingPairCache, this.solver, this.collisionConfiguration]
            = mylib2020.initAmmo(gravity);
        this.targetObjects = {};
        this.subStep = subStep;
        this.collisionList = new mylib2020.AmmoCollisionList();
    }

    applyPhysics(threeObject) {
        if (threeObject.userData.rigidBody) {
            mylib2020.applyAmmo(threeObject, threeObject.userData.rigidBody);
        }
    }

    registerObject(threeObject, rigidBody) {
        if (this.targetObjects[threeObject.id]) {
            return false;
        }
        mylib2020.addAmmoRigidBody(threeObject, rigidBody);
        this.targetObjects[threeObject.id] = threeObject;
        this.world.addRigidBody(threeObject.userData.rigidBody);
    }

    addPlane(threeObject, params = null) {
        this.registerObject(threeObject, mylib2020.createAmmoPlane(threeObject, params));
    }

    addBox(threeObject, params = null) {
        this.registerObject(threeObject, mylib2020.createAmmoBox(threeObject, params));
    }

    addSphere(threeObject, params = null) {
        this.registerObject(threeObject, mylib2020.createAmmoSphere(threeObject, params));
    }

    addCylinder(threeObject, params = null) {
        this.registerObject(threeObject, mylib2020.createAmmoCylinder(threeObject, params));
    }

    addCone(threeObject, params = null) {
        this.registerObject(threeObject, mylib2020.createAmmoCone(threeObject, params));
    }

    update(delta) {
        this.world.stepSimulation(delta, this.subStep);
        for (let k in this.targetObjects) {
            this.applyPhysics(this.targetObjects[k]);
        }
        this.updateCollision();
        return this.collisionList;
    }

    updateCollision() {
        this.collisionList.clear();
        const numManifolds = this.dispatcher.getNumManifolds();
        for (let i = 0; i < numManifolds; i++) {
            const manifold = this.dispatcher.getManifoldByIndexInternal(i); // btPersistentManifold
            const obA = Ammo.btRigidBody.prototype.upcast(manifold.getBody0()); // btCollisionObject 
            const obB = Ammo.btRigidBody.prototype.upcast(manifold.getBody1()); // btCollisionObject
            if (!obA.threeObject || !obB.threeObject) {
                console.log("updateCollision: found unregistered objects");
                continue;
            } else {
                // console.log(obA.threeObject.id + " & " + obB.threeObject.id);
            }
            const numContacts = manifold.getNumContacts(); // オブジェクト間の衝突点数
            if (numContacts > 0) {
                this.collisionList.addCollisionPairCross(obA.threeObject, obB.threeObject);
            }
        }
    }

    remove(threeObject) {
        if (threeObject.userData.rigidBody) {
            this.world.removeRigidBody(threeObject.userData.rigidBody);
            mylib2020.removeAmmoRigidBody(threeObject);
        }
        delete this.targetObjects[threeObject.id];
        this.scene.remove(threeObject);
    }
}