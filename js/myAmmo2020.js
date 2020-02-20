var mylib2020 = mylib2020 || {};

mylib2020.tmpTrans = null;

mylib2020.initAmmo = function () {
    let collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
    let dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
    let overlappingPairCache = new Ammo.btDbvtBroadphase();
    let solver = new Ammo.btSequentialImpulseConstraintSolver();
    let dynamicsWorld = new Ammo.btDiscreteDynamicsWorld(
        dispatcher,
        overlappingPairCache,
        solver,
        collisionConfiguration
    );
    dynamicsWorld.setGravity(new Ammo.btVector3(0, -10, 0));
    return dynamicsWorld;
}

mylib2020.createAmmoBase = function (pos, quat) {
    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
    let motionState = new Ammo.btDefaultMotionState(transform);
    let localInertia = new Ammo.btVector3(0, 0, 0);
    return [motionState, localInertia];
}

mylib2020.createAmmoRigidBody = function (motionState, colShape, localInertia, mass, margin = 0.05) {
    colShape.setMargin(margin);
    colShape.calculateLocalInertia(mass, localInertia);
    let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
    return new Ammo.btRigidBody(rbInfo);
}

mylib2020.createAmmoBox = function (bbox, pos, quat, mass, minLength = 0.01, margin = 0.05) {
    let [motionState, localInertia] = mylib2020.createAmmoBase(pos, quat);
    let size = {
        x: Math.max(minLength, Math.abs(bbox.max.x - bbox.min.x)),
        y: Math.max(minLength, Math.abs(bbox.max.y - bbox.min.y)),
        z: Math.max(minLength, Math.abs(bbox.max.z - bbox.min.z))
    };
    let colShape = new Ammo.btBoxShape(new Ammo.btVector3(size.x * 0.5, size.y * 0.5, size.z * 0.5));
    return mylib2020.createAmmoRigidBody(motionState, colShape, localInertia, mass, margin);
}

mylib2020.createAmmoSphere = function (radius, pos, quat, mass, margin = 0.05) {
    let [motionState, localInertia] = mylib2020.createAmmoBase(pos, quat);
    let colShape = new Ammo.btSphereShape(radius);
    return mylib2020.createAmmoRigidBody(motionState, colShape, localInertia, mass, margin);
}

mylib2020.applyAmmo = function (rigidBody, threeObject) {
    if (mylib2020.tmpTrans == undefined || mylib2020.tmpTrans == null) {
        mylib2020.tmpTrans = new Ammo.btTransform();
    }
    const tmpTrans = mylib2020.tmpTrans;
    const ms = rigidBody.getMotionState();
    ms.getWorldTransform(tmpTrans);
    const p = tmpTrans.getOrigin();
    const q = tmpTrans.getRotation();
    threeObject.position.set(p.x(), p.y(), p.z());
    threeObject.quaternion.set(q.x(), q.y(), q.z(), q.w());
}
